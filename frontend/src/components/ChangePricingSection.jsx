import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const ChangePricingSection = ({ discountRequestId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCancelAndChange = async () => {
    setLoading(true);
    try {
      await api.patch('/client/discount-requests/cancel', {});
      navigate('/client/daily-pass?type=regular');
    } catch (error) {
      console.error('Error cancelling discount request:', error);
      navigate('/client/daily-pass?type=regular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-6 mb-6">
      <p className="text-amber-200 mb-4">
        You have a pending discount request. Would you like to proceed with regular pricing instead?
      </p>
      <button 
        onClick={handleCancelAndChange}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
      >
        {loading ? 'Cancelling...' : 'Change to Regular Pricing'}
      </button>
    </div>
  );
};

export default ChangePricingSection;