import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Star, Calendar, Award, Dumbbell, Heart, Zap, Activity, ChevronRight } from "lucide-react";
import api from "../api/axios.js";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/public/trainers");
        const data = res.data?.trainers || res.data?.data || [];
        // Transform database fields to frontend format
        const transformed = data.map(t => ({
          ...t,
          name: t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.name || "Unknown",
          specialty: Array.isArray(t.specialization) 
            ? t.specialization[0]?.charAt(0).toUpperCase() + t.specialization[0]?.slice(1).toLowerCase()
            : t.specialization || t.specialty || "General",
          bio: t.bio || `Certified ${t.specialization?.[0] || "fitness"} trainer dedicated to helping clients achieve their fitness goals.`
        }));
        setTrainers(transformed);
      } catch (err) {
        console.error("Error fetching trainers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const specialties = ["all", "Strength & Conditioning", "Yoga", "Boxing", "HIIT", "Calisthenics", "Personal Training", "Nutrition"];

  const getSpecialtyIcon = (specialty) => {
    const iconMap = {
      "Yoga": Activity,
      "Boxing": Heart,
      "HIIT": Zap,
      "Calisthenics": Dumbbell,
      "Strength & Conditioning": Dumbbell,
      "Personal Training": Award,
    };
    return iconMap[specialty] || Award;
  };

  const filteredTrainers = selectedSpecialty === "all" 
    ? trainers 
    : trainers.filter(t => t.specialty === selectedSpecialty);

  const mockTrainers = [
    { _id: "1", name: "Mark Dela Cruz", specialty: "Strength & Conditioning", bio: "Certified strength and conditioning specialist with 10+ years of experience. Specializes in muscle building and athletic performance.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "mark@6packironcity.com" },
    { _id: "2", name: "Jane Rivera", specialty: "Yoga", bio: "Registered yoga instructor (RYT-500) specializing in Vinyasa and Hatha yoga. Focuses on flexibility, mindfulness, and holistic wellness.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "jane@6packironcity.com" },
    { _id: "3", name: "Mike Torres", specialty: "Boxing", bio: "Professional boxer turned coach with competitive boxing experience. Teaches proper technique, footwork, and conditioning.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "mike@6packironcity.com" },
    { _id: "4", name: "Sarah Chen", specialty: "HIIT", bio: "Certified HIIT instructor known for high-energy sessions. Creates challenging workouts that maximize calorie burn.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "sarah@6packironcity.com" },
    { _id: "5", name: "John Smith", specialty: "Calisthenics", bio: "Expert in bodyweight training and functional fitness. Helps clients master movements like pull-ups, muscle-ups, and more.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "john@6packironcity.com" },
    { _id: "6", name: "Maria Garcia", specialty: "Nutrition", bio: "Registered dietitian providing personalized nutrition plans. Combines meal planning with fitness goals for optimal results.", photo: "/icons/team.jpg", phone: "+63 XXX XXX XXXX", email: "maria@6packironcity.com" },
  ];

  const displayTrainers = filteredTrainers.length > 0 ? filteredTrainers : mockTrainers;

  return (
    <div className="min-h-screen text-white relative">

      {/* Hero */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              OUR <span className="text-red-500">TRAINERS</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Meet our team of certified fitness professionals dedicated to helping you achieve your goals. Book personalized sessions today.
            </p>
          </motion.div>

          {/* Specialty Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {specialties.map(specialty => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSpecialty === specialty 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {specialty === "all" ? "All Trainers" : specialty}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading trainers...</p>
            </div>
          ) : displayTrainers.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No Trainers Found</h3>
              <p className="text-gray-400">No trainers available for this specialty at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayTrainers.map((trainer, index) => {
                const SpecialtyIcon = getSpecialtyIcon(trainer.specialty);
                
                return (
                  <motion.div
                    key={trainer._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-4">
                      <img 
                        src={trainer.photo || "/icons/team.jpg"} 
                        alt={trainer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                        <SpecialtyIcon className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-red-500 font-medium text-sm">{trainer.specialty}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{trainer.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {trainer.bio || "Certified fitness professional dedicated to helping clients achieve their fitness goals."}
                    </p>

                    <div className="space-y-2 mb-4">
                      {trainer.phone && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Phone className="w-4 h-4" />
                          <span>{trainer.phone}</span>
                        </div>
                      )}
                      {trainer.email && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{trainer.email}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Session
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-red-500 mb-2">50+</div>
              <div className="text-gray-300">Certified Trainers</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-red-500 mb-2">1000+</div>
              <div className="text-gray-300">Sessions Completed</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-red-500 mb-2">4.9</div>
              <div className="text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              WANT A PERSONALIZED TRAINING?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Book a one-on-one session with our trainers to get a custom training plan tailored to your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book a Trainer
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}