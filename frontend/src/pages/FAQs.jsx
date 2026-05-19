import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Calendar, Phone, Mail, MapPin, Clock, CreditCard, Shield, User, AlertCircle } from "lucide-react";

const faqCategories = [
  {
    category: "membership & Passes",
    icon: Calendar,
    faqs: [
      { q: "What are the gym's operating hours?", a: "6Pack Iron City Gym is open 24 hours a day, 7 days a week including holidays!" },
      { q: "What is included in my daily pass?", a: "Your daily pass includes full gym access, all equipment usage, locker room access, and unlimited water refills. Group fitness classes may require separate booking." },
      { q: "How do I renew my membership?", a: "You can renew your membership through the client portal at /client/membership or visit the front desk. Automated email notifications are sent 3 days before expiration." },
      { q: "Can I upgrade my daily pass to a monthly membership?", a: "Yes! You can upgrade anytime through your client portal or at the front desk. The difference in price will be credited to your account." },
      { q: "What happens if my pass expires?", a: "Once your pass expires, you will not be able to access the gym until you renew. Automated notifications are sent via email before expiration." },
    ]
  },
  {
    category: "Discounts & ID Verification",
    icon: User,
    faqs: [
      { q: "Who qualifies for discounted rates?", a: "Students (with valid school ID), Persons with Disabilities (PWD), and Senior Citizens (60 years old and above) with valid Philippine IDs qualify for discounted rates." },
      { q: "What ID documents are accepted for discounts?", a: "We accept: Students - School ID/Enrollment, Senior Citizens - Senior Citizen ID or valid government ID with birthday, PWD - PWD ID or medical certificate." },
      { q: "How do I apply for a discount?", a: "Submit your discount request through the client portal at /client/discount-request with your valid ID. Approval typically takes 1-2 business days." },
      { q: "Is the discount available for all membership types?", a: "Discounts are available for all daily pass plans and memberships. Discounted pricing is automatically applied once your ID is verified." },
    ]
  },
  {
    category: "Classes & Bookings",
    icon: Calendar,
    faqs: [
      { q: "How do I book a fitness class?", a: "Login to your client portal and navigate to the class schedule. Select your preferred class and time, then click 'Book Now' to reserve your spot." },
      { q: "What is the cancellation policy for classes?", a: "You can cancel your class booking up to 2 hours before the scheduled time without penalty. Late cancellations may affect your booking privileges." },
      { q: "How do I know if a class has available slots?", a: "Real-time slot availability is displayed on the class schedule page. Green indicates available spots, yellow means limited spots, and red means the class is full." },
      { q: "Can I book multiple classes at once?", a: "Yes! You can book multiple classes through your client portal. Simply navigate through the schedule and add each class to your booking." },
      { q: "What happens if I miss a booked class?", a: "If you don't cancel and miss a class, it may be counted against your booking record. Repeated no-shows may result in temporary booking restrictions." },
    ]
  },
  {
    category: "Personal Training",
    icon: User,
    faqs: [
      { q: "How do I book a personal training session?", a: "Visit our Trainers page, select a trainer, and click 'Book Session' to schedule your personalized training. You can also book through the client portal." },
      { q: "What are the rates for personal training?", a: "Personal training rates vary by trainer and session package. Contact us or visit the front desk for current pricing and packages." },
      { q: "Can I request a specific trainer?", a: "Yes! You can choose your preferred trainer when booking. Each trainer has their own specialty and availability." },
      { q: "Do you offer nutrition coaching?", a: "Yes, we have certified nutrition coaches who can create personalized meal plans integrated with your fitness goals." },
    ]
  },
  {
    category: "Payments & Xendit",
    icon: CreditCard,
    faqs: [
      { q: "What payment methods do you accept?", a: "We accept cash, credit/debit cards, and online payments via Xendit (GCash, Maya, credit cards). All payments are processed securely through Xendit." },
      { q: "How do I pay for my membership online?", a: "Login to your client portal, go to Payments, select your plan, and complete payment through our secure Xendit integration." },
      { q: "Is my payment information secure?", a: "Yes! All payments are processed through Xendit, a PCI-DSS certified payment gateway. We never store your card details on our servers." },
      { q: "Can I get a refund for unused days?", a: "Refunds are handled case-by-case. Please contact our admin team for assistance with refund requests." },
    ]
  },
  {
    category: "Gym Policies & Facilities",
    icon: Shield,
    faqs: [
      { q: "What should I bring to the gym?", a: "Bring valid ID, appropriate workout attire, and athletic shoes. Lockers are available but bring your own lock." },
      { q: "Is there a dress code?", a: "Yes. Proper workout attire and closed-toe athletic shoes are required. No jeans, sandals, or offensive clothing." },
      { q: "Are there age restrictions?", a: "clients must be at least 16 years old. Those under 18 need parental consent. Senior citizens of any age are welcome." },
      { q: "Is the gym accessible for persons with disabilities?", a: "Yes! Our facility is equipped with accessible entrances, equipment, and restrooms. Our staff is trained to assist PWD clients." },
      { q: "Is there free parking?", a: "Yes, we offer free parking for all clients with spacious lots and easy access from the main road." },
    ]
  },
  {
    category: "Portal & Technical",
    icon: AlertCircle,
    faqs: [
      { q: "I can't login to my account. What should I do?", a: "Use the 'Forgot Password' option on the login page to reset your password. If issues persist, contact support." },
      { q: "How do I update my profile information?", a: "Login to your client portal and navigate to Profile to update your personal information, contact details, and emergency contacts." },
      { q: "Why am I not receiving email notifications?", a: "Check your spam/junk folder. Add noreply@6packironcity.com to your contacts. Ensure your email is verified in your profile." },
      { q: "How do I track my workout progress?", a: "Use the Progress tab in your client portal to track weight, measurements, workout history, and AI-generated recommendations." },
    ]
  }
];

export default function FAQs() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredCategories = selectedCategory === "all" 
    ? faqCategories 
    : faqCategories.filter(cat => cat.category === selectedCategory);

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
              FREQUENTLY ASKED <span className="text-red-500">QUESTIONS</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Find answers to common questions about memberships, classes, bookings, payments, and gym policies at 6Pack Iron City Gym.
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === "all" 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All Questions
            </button>
            {faqCategories.map(cat => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.category 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCategories.map((category, catIndex) => (
            <div key={category.category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold">{category.category}</h2>
              </div>

              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = `${catIndex}-${faqIndex}`;
                  const isOpen = openFaq === globalIndex;

                  return (
                    <motion.div
                      key={faqIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: faqIndex * 0.05 }}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(globalIndex)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-white pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-red-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-gray-300 border-t border-white/10 pt-4">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Info */}
      <section className="relative z-10 py-16 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Call Us</h3>
              <p className="text-gray-400">+63 XXX XXX XXXX</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Email Us</h3>
              <p className="text-gray-400">info@6packironcity.com</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Visit Us</h3>
              <p className="text-gray-400">Burol 1, Dasmarinas, Cavite</p>
            </div>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-white" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              STILL HAVE QUESTIONS?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Can't find the answer you're looking for? Contact our team and we'll be happy to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                Contact Us
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