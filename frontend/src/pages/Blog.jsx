import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Search, Dumbbell, Heart, Zap, Activity, TrendingUp, Flame, ChevronRight } from "lucide-react";
import api from "../api/axios.js";

const blogPosts = [
  {
    _id: "1",
    title: "10 Tips for Beginners Starting Their Fitness Journey",
    excerpt: "Starting your fitness journey can be overwhelming. Here are 10 essential tips to help you get started and stay motivated on your path to a healthier lifestyle.",
    category: "Fitness Tips",
    author: "Mark Dela Cruz",
    date: "2026-04-01",
    image: "/icons/team.jpg",
    readTime: "5 min read"
  },
  {
    _id: "2",
    title: "Nutrition Basics: Fuel Your Workouts Right",
    excerpt: "Proper nutrition is the foundation of any fitness journey. Learn about macronutrients, meal timing, and how to fuel your body for optimal performance.",
    category: "Nutrition",
    author: "Maria Garcia",
    date: "2026-03-28",
    image: "/icons/team.jpg",
    readTime: "7 min read"
  },
  {
    _id: "3",
    title: "HIIT vs Steady-State Cardio: Which is Better?",
    excerpt: "We break down the benefits of high-intensity interval training versus traditional steady-state cardio to help you choose what's best for your goals.",
    category: "Workouts",
    author: "Sarah Chen",
    date: "2026-03-25",
    image: "/icons/6pack.jpg",
    readTime: "6 min read"
  },
  {
    _id: "4",
    title: "The Benefits of Group Fitness Classes",
    excerpt: "Discover why working out in a group setting can boost your motivation, accountability, and results. Plus, find out about our class offerings.",
    category: "Fitness Tips",
    author: "Jane Rivera",
    date: "2026-03-20",
    image: "/icons/team.jpg",
    readTime: "4 min read"
  },
  {
    _id: "5",
    title: "Boxing Basics: Master the Fundamentals",
    excerpt: "Learn the essential boxing techniques that will improve your coordination, strength, and confidence. Perfect for beginners looking to try something new.",
    category: "Workouts",
    author: "Mike Torres",
    date: "2026-03-15",
    image: "/icons/team.jpg",
    readTime: "8 min read"
  },
  {
    _id: "6",
    title: "How AI is Revolutionizing Fitness Training",
    excerpt: "Explore how artificial intelligence is transforming the fitness industry with personalized workout recommendations and data-driven insights.",
    category: "Technology",
    author: "6Pack Iron City",
    date: "2026-03-10",
    image: "/icons/6pack.jpg",
    readTime: "5 min read"
  },
];

const categories = [
  { name: "All Posts", icon: Dumbbell, count: 24 },
  { name: "Fitness Tips", icon: TrendingUp, count: 8 },
  { name: "Nutrition", icon: Heart, count: 6 },
  { name: "Workouts", icon: Zap, count: 7 },
  { name: "Technology", icon: Activity, count: 3 },
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredPost, setFeaturedPost] = useState(null);

  useEffect(() => {
    setLoading(false);
    setPosts(blogPosts);
    setFeaturedPost(blogPosts[0]);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All Posts" || post.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
              FITNESS <span className="text-red-500">BLOG</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Expert tips, workout guides, nutrition advice, and health insights to help you achieve your fitness goals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="relative z-10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span className="inline-block px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-sm font-medium mb-4 w-fit">
                    Featured
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-white">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-400 mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.date)}
                    </span>
                  </div>
                  <Link 
                    to="/login"
                    className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="relative z-10 py-8 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.name 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No Articles Found</h3>
              <p className="text-gray-400">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all overflow-hidden"
                >
                  <div className="aspect-video">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-red-500 text-sm font-medium">{post.category}</span>
                      <span className="text-gray-500 text-sm">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <Link 
                        to="/login"
                        className="text-red-500 hover:text-red-400 font-medium text-sm flex items-center gap-1"
                      >
                        Read <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative z-10 py-16 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Flame className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-3xl font-bold mb-4">STAY UPDATED</h2>
            <p className="text-gray-400 mb-8">
              Subscribe to our newsletter for the latest fitness tips, nutrition advice, and gym updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
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
              Join 6Pack Iron City Gym and get access to expert trainers, classes, and a supportive community.
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