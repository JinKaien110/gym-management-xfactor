import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Users, Clock, Heart, ArrowRight, Check, Menu, X, Loader2, Target, Zap, Award, Shield, Flame, Utensils, Tv, Car, Play } from "lucide-react";
import api from "../api/axios.js";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Fetch plans and pricing from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, pricingRes] = await Promise.all([
          api.get("/public/plans?status=active&limit=100"),
          api.get("/public/pricing?status=active&limit=100")
        ]);
        
        const plansData = plansRes.data.data || [];
        const pricingData = pricingRes.data.data || [];
        
        setPlans(plansData);
        setPricing(pricingData);
      } catch (err) {
        console.error("Error fetching plans/pricing:", err);
        setError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll to pricing section
  const scrollToPricing = () => {
    document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
      if(window.location.hash === "#membership") {
        scrollToPricing();
      }
  }, [])

  // Get plan info by plan_id
  const getPlanById = (planId) => {
    if (!planId) return null;
    // Handle both string and ObjectId comparisons
    const planIdStr = String(planId);
    return plans.find(p => {
      if (!p._id) return false;
      return String(p._id) === planIdStr || p._id === planId;
    });
  };

  // Get regular pricing only (filter out discounted for main display)
  const regularPricing = pricing;

  const handleChoosePlan = (priceOption) => {
    const associatedPlan = getPlanById(priceOption.plan_id);

    const memberType = associatedPlan?.name === "student_pwd_senior"
    ? "discounted"
    : "regular";

    navigate(`/register?plan_id=${priceOption.plan_id}&price_id=${priceOption._id}&member_type=${memberType}`);
  }


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950 to-black"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-1"
            >
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img 
                    src="/icons/team.jpg" 
                    alt="Gym Training" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>

            {/* Right Column - Description */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-2"
            >
              {/* Logo */}
              <div className="mb-4 flex items-center gap-3">
                <img 
                  src="/icons/6pack.jpg" 
                  alt="6Pack Iron City Gym" 
                  className="w-16 h-16 rounded-full border-4 border-red-600 object-cover"
                />
                <span className="text-xl font-bold text-red-600">6Pack Iron City</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                <span className="text-white">TRANSFORM YOUR</span>
                <br />
                <span className="text-red-600">BODY & LIFE</span>
              </h1>

              <p className="text-lg md:text-lg text-gray-300 mb-4 max-w-xl">
                Join 6Pack Iron City and achieve your fitness goals with 
                professional trainers and modern equipment.
              </p>

              <p className="text-md text-gray-400 mb-6">
                📍 6Pack Iron City
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToPricing}
                  className="group bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-base font-bold transition flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={scrollToPricing}
                  className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-lg text-base font-bold transition"
                >
                  View Plans
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-red-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-red-600 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* About Section - Combined Mission, Vision, Core Values & Why Choose */}
      <section className="py-20 bg-gradient-to-r from-black via-red-950/20 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              WHY CHOOSE <span className="text-red-600">6Pack Iron City</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to achieve your fitness goals
            </p>
          </div>

          {/* Row 1: Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-red-900/30 to-black border border-red-600/30 p-6 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-white">MISSION</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                To empower individuals of all fitness levels to transform their lives through scientific training methods, personalized coaching, and a supportive community environment.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gradient-to-br from-red-900/30 to-black border border-red-600/30 p-6 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-white">VISION</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                To be the leading fitness destination in the region, known for excellence in training, innovative programs, and unwavering commitment to member success.
              </p>
            </motion.div>
          </div>

          {/* Row 2: Core Values & Features combined */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Core Values */}
            {[
              { icon: Award, title: "Excellence", desc: "Highest standards" },
              { icon: Users, title: "Community", desc: "Shared journeys" },
              { icon: Shield, title: "Integrity", desc: "Honesty & trust" },
              { icon: Heart, title: "Dedication", desc: "Your success" },
            ].map((item, index) => (
              <motion.div
                key={`value-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-black border border-red-900/50 p-4 rounded-xl text-center hover:border-red-600 transition-colors"
              >
                <item.icon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-xs">{item.desc}</p>
              </motion.div>
            ))}

            {/* Features */}
            {[
              { icon: Dumbbell, title: "Equipment", desc: "Modern gear" },
              { icon: Clock, title: "Hours", desc: "Open 24/7" },
              { icon: Users, title: "Trainers", desc: "Expert staff" },
              { icon: Heart, title: "Support", desc: "Personal care" },
            ].map((item, index) => (
              <motion.div
                key={`feature-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-black border border-red-900/50 p-4 rounded-xl text-center hover:border-red-600 transition-colors"
              >
                <item.icon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Video Section */}
      <section className="py-20 bg-gradient-to-b from-red-950/30 via-black to-red-950/30 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Promo Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                JOIN THE <span className="text-red-600">6Pack Iron City</span> FAMILY
              </h2>
              <p className="text-gray-300 text-lg mb-4 leading-relaxed">
                At 6Pack Iron City, we don't just offer gym memberships – we offer a lifestyle transformation. Our state-of-the-art facility features over 500+ equipment pieces, dedicated training zones, and a community of motivated individuals committed to their fitness journey.
              </p>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Whether you're looking to <span className="text-red-500">build muscle</span>, <span className="text-red-500">lose weight</span>, or just stay healthy, our expert trainers and flexible membership plans are designed to help you achieve your goals. Plus, enjoy exclusive benefits like <span className="text-red-500">free group classes</span>, <span className="text-red-500">nutrition counseling</span>, and <span className="text-red-500">24/7 gym access</span>.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-red-600" />
                  <span className="text-gray-300">15,000+ Active Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-red-600" />
                  <span className="text-gray-300">50+ Expert Trainers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-red-600" />
                  <span className="text-gray-300">100+ Group Classes</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Video */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-red-900/30 border-2 border-red-600/30">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1&controls=1&loop=1&playlist=dQw4w9WgXcQ"
                  title="6Pack Iron City Promo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-red-600/80 rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Plan & Pricing Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-red-950/10 via-black to-red-950/10 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-0 left-1/4 w-48 h-48 bg-red-600/5 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 7 }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              PLAN <span className="text-red-600">BENEFITS</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything included with your membership
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Regular Membership Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-red-900/30 to-black border border-red-600/50 p-6 rounded-2xl"
            >
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">REGULAR MEMBER</h3>
              <ul className="space-y-3">
                {[
                  "Full gym access 24/7",
                  "All equipment usage",
                  "Locker room access",
                  "Free parking",
                  "Mobile app access",
                  "Guest passes (2/month)"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-red-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Discounted Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-red-900/30 to-black border border-red-600/50 p-6 rounded-2xl"
            >
              <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">DISCOUNTED*</h3>
              <ul className="space-y-3">
                {[
                  "Full gym access 24/7",
                  "All equipment usage",
                  "Locker room access",
                  "Free parking",
                  "Mobile app access",
                  "Valid ID required"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-red-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                *For Students, PWD, and Senior Citizens with valid ID
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Membership Plans - Show each pricing option as a card */}
      <section id="membership" className="py-20 bg-gradient-to-r from-black via-red-900/20 to-black relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-1/2 left-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 9 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              MEMBERSHIP <span className="text-red-600">PLANS</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your fitness journey
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <span className="ml-3 text-gray-400">Loading plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-red-500 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : regularPricing.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">No plans available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularPricing.map((priceOption, index) => {
                const associatedPlan = getPlanById(priceOption.plan_id);
                const isPopular = index === 1; // Mark middle option as popular

                return (
                  <motion.div 
                    key={priceOption._id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative bg-black border-2 ${
                      isPopular ? 'border-red-600' : 'border-red-900/50'
                    } p-6 rounded-2xl flex flex-col`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                        POPULAR
                      </div>
                    )}

                    {/* Main Name - Pricing Label (duration) */}
                    <h3 className="text-2xl font-bold mb-1 uppercase">{priceOption.label}</h3>
                    
                    {/* Secondary - Plan Name */}
                    <p className="text-gray-400 mb-4 text-sm">
                      {associatedPlan?.label || associatedPlan?.name || 'Standard Plan'}
                    </p>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-red-600">₱{priceOption.price?.toLocaleString()}</span>
                      <span className="text-gray-400">/{priceOption.duration_days >= 30 ? 'month' : 'day'}</span>
                    </div>

                    {/* Features from plan */}
                    {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                      <ul className="space-y-3 mb-6 flex-grow">
                        {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-300">
                            <Check className="w-5 h-5 text-red-600 flex-shrink-0" /> 
                            <span className="line-clamp-2">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="space-y-3 mb-6 flex-grow">
                        <li className="flex items-center gap-2 text-gray-300">
                          <Check className="w-5 h-5 text-red-600" /> Gym Access
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <Check className="w-5 h-5 text-red-600" /> Modern Equipment
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <Check className="w-5 h-5 text-red-600" /> Locker Room
                        </li>
                      </ul>
                    )}

                    {/* Membership Fee Info */}
                    {priceOption.membership_fee > 0 && (
                      <div className="mb-4 text-sm text-gray-500">
                        + ₱{priceOption.membership_fee?.toLocaleString()} one-time membership fee
                      </div>
                    )}

                    <button 
                      onClick={() => handleChoosePlan(priceOption)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-center transition mt-auto"
                    >
                      Choose Plan
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Discount Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Special discounts available for:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                🎓 Students
              </span>
              <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                ♿ PWD
              </span>
              <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                👴 Senior Citizens
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Discounted pricing requires verification. Proceed with registration to apply.
            </p>
          </div>
        </div>
      </section>

      {/* About Section - Old duplicate, to be removed */}
      <section id="about" className="py-20 bg-gradient-to-b from-red-950/20 via-black to-red-950/20 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                ABOUT <span className="text-red-600">6Pack Iron City</span>
              </h2>
              <p className="text-gray-400 mb-6">
                6Pack Iron City is dedicated to helping you transform your body and life. 
                With state-of-the-art equipment and expert trainers, we provide the perfect 
                environment for your fitness journey.
              </p>
              <p className="text-gray-400 mb-8">
                Whether you're a beginner or an experienced athlete, our gym has everything 
                you need to reach your goals.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">15K+</div>
                  <div className="text-gray-400 text-sm">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">20+</div>
                  <div className="text-gray-400 text-sm">Trainers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">50+</div>
                  <div className="text-gray-400 text-sm">Classes</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-red-600">
                <img 
                  src="/icons/6pack.jpg" 
                  alt="6Pack Iron City Gym Interior" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative frame */}
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-red-600 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-900 to-red-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            READY TO START YOUR JOURNEY?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join thousands of members who have transformed their lives at 6Pack Iron City. Sign up today and take the first step towards a healthier, stronger you!
          </p>
          <button 
            onClick={scrollToPricing}
            className="inline-block bg-white text-red-600 hover:bg-gray-100 px-10 py-4 rounded-xl text-lg font-bold transition"
          >
            JOIN NOW
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-red-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-wider">6Pack Iron City</span>
              </div>
              <p className="text-gray-400">
                6Pack Iron City Gym<br />
                Your partner in fitness
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">CONTACT</h4>
              <p className="text-gray-400">
                📍 City of Dasmarinas, Cavite, Philippines<br />
                📞 +63 XXX XXX XXXX<br />
                ✉️ info@6packironcity.com
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">HOURS</h4>
              <p className="text-gray-400">
                Open 24/7<br />
                Monday - Sunday<br />
                Holidays Included
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-red-900 text-center text-gray-500">
            © 2026 6Pack Iron City Gym. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
