from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- AWS CONFIGURATION ---
REGION_NAME = os.environ.get("AWS_REGION", "ap-south-2")
ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
SNS_TOPIC_ARN = os.environ.get("AWS_SNS_TOPIC_ARN")

# Initialize AWS Resources
try:
    session = boto3.Session(
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name=REGION_NAME
    )
    dynamodb = session.resource('dynamodb')
    sns = session.client('sns')
    
    # Mapping to your 5 verified tables
    USERS_TABLE = dynamodb.Table("WorkPulseUsers")
    NODES_TABLE = dynamodb.Table("WorkPulseNodes")
    TASKS_TABLE = dynamodb.Table("WorkPulseTasks")
    LEAVE_TABLE = dynamodb.Table("WorkPulseLeave")
    PROJECTS_TABLE = dynamodb.Table("WorkPulseProjects")
    
    print(f"✅ Cloud Handshake Established: {REGION_NAME}")
    if SNS_TOPIC_ARN:
        print(f"🔔 SNS Notifications Linked: {SNS_TOPIC_ARN}")
    else:
        print(f"⚠️ Warning: AWS_SNS_TOPIC_ARN is missing from .env")
except Exception as e:
    print(f"❌ Cloud Handshake Failed: {e}")
    dynamodb = None
    sns = None

@app.route('/')
def health_check():
    return jsonify({
        "status": "online",
        "aws_connected": dynamodb is not None,
        "sns_ready": sns is not None and SNS_TOPIC_ARN is not None,
        "region": REGION_NAME
    }), 200

# --- AUTHENTICATION ---
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    if not USERS_TABLE: return jsonify({"error": "AWS Offline"}), 503
    data = request.json
    user_id = data.get('id', '').upper().strip()
    try:
        if 'Item' in USERS_TABLE.get_item(Key={'id': user_id}):
            return jsonify({"error": "Identity already registered"}), 409
        
        user_item = {
            'id': user_id,
            'password': generate_password_hash(data.get('password')),
            'name': data.get('name', 'Operator'),
            'role': 'manager' if user_id.startswith('MGR') else 'employee',
            'manager_id': data.get('manager_id', '').upper().strip(),
            'department': data.get('department', 'General'),
            'position': data.get('position', 'Operator'),
            'contact': data.get('contact', 'N/A'),
            'createdAt': datetime.now().isoformat()
        }
        USERS_TABLE.put_item(Item=user_item)
        return jsonify({"status": "success"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    if not USERS_TABLE: return jsonify({"error": "AWS Offline"}), 503
    data = request.json
    try:
        res = USERS_TABLE.get_item(Key={'id': data.get('id', '').upper().strip()})
        if 'Item' not in res: return jsonify({"error": "Identity not found"}), 401
        user = res['Item']
        if check_password_hash(user['password'], data.get('password')):
            user.pop('password', None)
            return jsonify({"status": "success", "user": user}), 200
        return jsonify({"error": "Invalid Hash"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- TELEMETRY ---
@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    if not NODES_TABLE: return jsonify({"error": "AWS Offline"}), 503
    data = request.json
    try:
        NODES_TABLE.put_item(Item={
            'id': data.get('employee_id', '').upper(),
            'currentStatus': data.get('status', 'active'),
            'lastSeen': datetime.now().strftime("%H:%M:%S"),
            'metrics': data.get('metrics', {}),
            'updatedAt': datetime.now().isoformat()
        })
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ABSENCE & REAL-TIME ALERTS ---
@app.route('/api/leave/request', methods=['POST'])
def request_leave():
    if not LEAVE_TABLE: return jsonify({"error": "AWS Offline"}), 503
    data = request.json
    try:
        # 1. Save to DynamoDB
        LEAVE_TABLE.put_item(Item=data)
        print(f"📝 Leave Record Saved: {data.get('id')}")
        
        # 2. TRIGGER EMAIL NOTIFICATION (SNS)
        if sns and SNS_TOPIC_ARN:
            print(f"📡 Attempting SNS Publish to: {SNS_TOPIC_ARN}")
            message = (
                f"NEW ABSENCE PROTOCOL FILED\n"
                f"---------------------------\n"
                f"Employee: {data.get('name')} ({data.get('employee_id')})\n"
                f"Type: {data.get('type')}\n"
                f"Duration: {data.get('days')} Day(s)\n"
                f"Reason: {data.get('reason')}\n"
                f"Submitted: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
                f"Status: Awaiting Cluster Admin Approval."
            )
            
            response = sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject=f"WorkPulse ALERT: Leave Request - {data.get('employee_id')}"
            )
            print(f"✅ SNS Response: MessageId={response.get('MessageId')}")
        else:
            print("⚠️ SNS Publish Skipped: Missing Client or ARN")
            
        return jsonify({"status": "success"}), 201
    except Exception as e:
        print(f"❌ Leave/SNS Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/leave/list', methods=['GET'])
def list_leaves():
    if not LEAVE_TABLE: return jsonify([]), 200
    emp_id = request.args.get('employee_id', '').upper()
    mgr_id = request.args.get('manager_id', '').upper()
    try:
        res = LEAVE_TABLE.scan()
        items = res.get('Items', [])
        if emp_id: items = [i for i in items if i.get('employee_id') == emp_id]
        if mgr_id: items = [i for i in items if i.get('manager_id') == mgr_id]
        items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return jsonify(items), 200
    except Exception as e:
        return jsonify([]), 200

@app.route('/api/leave/action', methods=['PATCH'])
def action_leave():
    data = request.json
    try:
        LEAVE_TABLE.update_item(
            Key={'id': data.get('leave_id')},
            UpdateExpression="set #s = :s",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': data.get('status')}
        )
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- PROJECTS ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    if not PROJECTS_TABLE: return jsonify([]), 200
    try:
        res = PROJECTS_TABLE.scan()
        return jsonify(res.get('Items', [])), 200
    except Exception as e:
        return jsonify([]), 200

# --- MANAGER STATS ---
@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    mgr_id = request.args.get('manager_id', '').upper()
    if not USERS_TABLE or not NODES_TABLE: return jsonify([]), 200
    try:
        users_res = USERS_TABLE.scan()
        team = [u for u in users_res.get('Items', []) if u.get('manager_id') == mgr_id]
        nodes_res = NODES_TABLE.scan()
        live_data = {n['id']: n for n in nodes_res.get('Items', [])}
        registry = []
        for emp in team:
            pulse = live_data.get(emp['id'], {})
            registry.append({
                "id": emp['id'], "name": emp.get('name'), "department": emp.get('department'),
                "position": emp.get('position'), "contact": emp.get('contact'),
                "currentStatus": pulse.get('currentStatus', 'offline'),
                "lastSeen": pulse.get('lastSeen', 'Never'),
                "metrics": pulse.get('metrics', {"keys": 0})
            })
        return jsonify(registry), 200
    except Exception as e:
        return jsonify([]), 200

# --- MISSIONS ---
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    if not TASKS_TABLE: return jsonify([]), 200
    emp_id = request.args.get('employee_id', '').upper()
    try:
        res = TASKS_TABLE.scan()
        items = [t for t in res.get('Items', []) if t.get('assignedTo') == emp_id]
        return jsonify(items), 200
    except Exception as e:
        return jsonify([]), 200

@app.route('/api/tasks/assign', methods=['POST'])
def assign_task():
    data = request.json
    try:
        TASKS_TABLE.put_item(Item={
            'id': str(uuid.uuid4()),
            'assignedTo': data.get('employee_id', '').upper(),
            'assignedBy': data.get('manager_id', '').upper(),
            'text': data.get('text'),
            'done': False,
            'timestamp': datetime.now().isoformat()
        })
        return jsonify({"status": "success"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tasks/toggle', methods=['PATCH'])
def toggle_task():
    data = request.json
    try:
        TASKS_TABLE.update_item(
            Key={'id': data.get('task_id')},
            UpdateExpression="set done = :d",
            ExpressionAttributeValues={':d': data.get('done')}
        )
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)