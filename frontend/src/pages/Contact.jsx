import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle, Facebook, Instagram, Twitter } from "lucide-react";
import api from "../api/axios.js";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      setStatus({ 
        type: "success", 
        message: "Thank you for contacting us! We'll get back to you within 24-48 hours." 
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: "Failed to send message. Please try again or contact us directly." 
      });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, title: "Address", content: "Near St. Paul Hospital, Burol 1, City of Dasmarinas, Cavite, Philippines" },
    { icon: Phone, title: "Phone", content: "+63 XXX XXX XXXX" },
    { icon: Mail, title: "Email", content: "info@6packironcity.com" },
    { icon: Clock, title: "Hours", content: "Open 24/7 including holidays" },
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#" },
    { icon: Instagram, name: "Instagram", url: "#" },
    { icon: Twitter, name: "Twitter", url: "#" },
  ];

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
              CONTACT <span className="text-red-500">US</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Have questions about memberships, classes, or training? We're here to help. Reach out to us through any of the channels below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <div className="w-12 h-12 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <info.icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{info.title}</h3>
                <p className="text-gray-400 text-sm">{info.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              
              {status.message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                  status.type === "success" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {status.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 appearance-none"
                    >
                      <option value="" className="bg-slate-800">Select a subject</option>
                      <option value="membership" className="bg-slate-800">membership Inquiry</option>
                      <option value="classes" className="bg-slate-800">Classes & Bookings</option>
                      <option value="training" className="bg-slate-800">Personal Training</option>
                      <option value="payments" className="bg-slate-800">Payments</option>
                      <option value="feedback" className="bg-slate-800">Feedback</option>
                      <option value="other" className="bg-slate-800">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                    placeholder="How can we help you today?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10"
            >
              <h2 className="text-2xl font-bold mb-6">Find Us</h2>
              
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 mb-6">
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <MapPin className="w-16 h-16 mb-4 text-red-500" />
                  <p className="text-center px-4">
                    Near St. Paul Hospital, Burol 1<br />
                    City of Dasmarinas, Cavite<br />
                    Philippines
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link to="/#daily-pass" className="block text-gray-400 hover:text-red-500 transition-colors">
                    → Daily Pass & membership
                  </Link>
                  <Link to="/schedules" className="block text-gray-400 hover:text-red-500 transition-colors">
                    → Class Schedules
                  </Link>
                  <Link to="/trainers" className="block text-gray-400 hover:text-red-500 transition-colors">
                    → Our Trainers
                  </Link>
                  <Link to="/faqs" className="block text-gray-400 hover:text-red-500 transition-colors">
                    → FAQs
                  </Link>
                </div>
              </div>
            </motion.div>
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
              READY TO START YOUR FITNESS JOURNEY?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Join thousands of clients who have transformed their lives at 6Pack Iron City Gym.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/#daily-pass" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                Get Your Pass
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                client Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}