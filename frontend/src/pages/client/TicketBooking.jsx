import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Calendar, Clock, Dumbbell, Users } from "lucide-react";

const ticketOptions = [
  {
    id: "weekend",
    name: "Weekend Pass",
    price: 45,
    description: "Perfect for those who can only visit on weekends",
    features: [
      "Full gym access on Saturdays & Sundays",
      "Access to all equipment",
      "Locker room access",
      "Free parking validation",
      "Group fitness classes included"
    ]
  },
  {
    id: "weekday",
    name: "Weekday Pass",
    price: 35,
    description: "Ideal for regular weekday visitors",
    features: [
      "Full gym access Monday - Friday",
      "Access to all equipment",
      "Locker room access",
      "Free parking validation",
      "Group fitness classes included"
    ]
  }
];

const FloatingOrbs = () => {
  const orbs = [
    { size: 120, x: "10%", y: "20%", delay: "0s", duration: "20s", color: "bg-cyan-500" },
    { size: 80, x: "80%", y: "15%", delay: "2s", duration: "18s", color: "bg-magenta-500" },
    { size: 150, x: "60%", y: "70%", delay: "4s", duration: "22s", color: "bg-purple-500" },
    { size: 100, x: "20%", y: "60%", delay: "1s", duration: "25s", color: "bg-orange-500" },
    { size: 90, x: "85%", y: "80%", delay: "3s", duration: "19s", color: "bg-cyan-400" },
    { size: 130, x: "40%", y: "10%", delay: "5s", duration: "21s", color: "bg-magenta-400" },
    { size: 70, x: "5%", y: "85%", delay: "2.5s", duration: "17s", color: "bg-purple-400" },
    { size: 110, x: "75%", y: "45%", delay: "1.5s", duration: "23s", color: "bg-orange-400" }
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, index) => (
        <div
          key={index}
          className={`absolute rounded-full ${orb.color} opacity-20 blur-3xl`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            animation: `float${index} ${orb.duration} ease-in-out infinite`,
            animationDelay: orb.delay
          }}
        />
      ))}
      <style>{`
        @keyframes float0 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -50px) scale(1.05); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 20px) scale(1.1); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -30px) scale(0.9); }
        }
        @keyframes float5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 40px) scale(1.15); }
        }
        @keyframes float6 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -20px) scale(1); }
        }
        @keyframes float7 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(0.95); }
        }
      `}</style>
    </div>
  );
};

export default function TicketBooking() {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleProceed = () => {
    if (!selectedTicket) return;
    const ticket = ticketOptions.find(t => t.id === selectedTicket);
    console.log("Proceeding with:", ticket);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <FloatingOrbs />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-cyan-400 mb-4">
                Daily Pass
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Select Your Pass
              </h1>
              <p className="text-zinc-400 mt-2 text-sm sm:text-base">
                Choose the pass that fits your schedule
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 mb-8"
            >
              {ticketOptions.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`relative group cursor-pointer ${
                    selectedTicket === ticket.id
                      ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950"
                      : "hover:ring-2 hover:ring-white/30"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-magenta-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:border-zinc-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {ticket.id === "weekend" ? (
                            <Calendar className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-magenta-400" />
                          )}
                          <h3 className="text-xl font-bold text-white">{ticket.name}</h3>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">{ticket.description}</p>
                        
                        <ul className="space-y-2">
                          {ticket.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-3xl sm:text-4xl font-bold text-white">
                          ${ticket.price}
                        </p>
                        <p className="text-zinc-500 text-sm">per day</p>
                      </div>
                    </div>
                    
                    {selectedTicket === ticket.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              onClick={handleProceed}
              disabled={!selectedTicket}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                selectedTicket
                  ? "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Proceed to Checkout
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}