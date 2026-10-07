import React, { useState, useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';

const Contact = () => {
  const { showToast } = useContext(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      showToast('Thank you for contacting us! We will reply shortly.', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Page Header */}
      <section className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">Get in Touch</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Have questions about orders, commercial pricing, or our farming practices? Send us a message!
        </p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Contact Info */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 lg:col-span-1">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-3">Contact Details</h3>

          <div className="space-y-6">
            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-farm-green shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Farm Address</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">10 Organic Way, Agro Valley, GreenState, US</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="w-6 h-6 text-farm-green shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Phone Support</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">+94 11 274 6622</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="w-6 h-6 text-farm-green shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Email Address</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">support@ripomafarm.com</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="w-6 h-6 text-farm-green shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Business Hours</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Monday - Friday: 8 AM - 5 PM<br />Saturday: 9 AM - 2 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-3">Send a Message</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 focus:ring-2 focus:ring-farm-green rounded-xl py-2 px-3 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 focus:ring-2 focus:ring-farm-green rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                className="w-full border border-gray-200 focus:ring-2 focus:ring-farm-green rounded-xl py-2 px-3 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Message Body</label>
              <textarea
                name="message"
                rows="5"
                required
                value={form.message}
                onChange={handleChange}
                className="w-full border border-gray-200 focus:ring-2 focus:ring-farm-green rounded-xl p-3 text-sm"
                placeholder="Detail your inquiry here..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending...' : 'Send Inquiry'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;
