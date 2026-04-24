import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatusCard = () => {
  const [status, setStatus] = useState('active');
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await axios.post('http://127.0.0.1:5000/api/heartbeat', {
          employee_id: "EMP_TEJA_01", // Hardcoded for now
          status: status,
        });
        setLastSynced(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Cloud Sync Failed", err);
      }
    };

    const interval = setInterval(sendHeartbeat, 10000); // 10s for testing
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div style={{ padding: '20px', borderRadius: '15px', background: '#1a1a1a', color: 'white', maxWidth: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Productivity Monitor</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button 
          onClick={() => setStatus('active')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: status === 'active' ? '#4CAF50' : '#333', color: 'white', cursor: 'pointer' }}>
          Active
        </button>
        <button 
          onClick={() => setStatus('idle')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: status === 'idle' ? '#FF9800' : '#333', color: 'white', cursor: 'pointer' }}>
          Idle
        </button>
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        Status: <span style={{ color: status === 'active' ? '#4CAF50' : '#FF9800' }}>{status.toUpperCase()}</span><br />
        Last Cloud Sync: {lastSynced || 'Syncing...'}
      </div>
    </div>
  );
};

export default StatusCard;