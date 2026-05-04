import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from './Motion';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1500);
  };

  return (
    <section id="contact" className="section" style={{
      background: 'radial-gradient(ellipse 70% 60% at 100% 50%, rgba(204,255,0,0.06), transparent 60%), transparent',
    }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 60, alignItems: 'start',
        }}>
          {/* Left info */}
          <div>
            <span className="tag tag-lime" style={{ marginBottom: 20, display: 'inline-flex' }}>✉️ contact us</span>
            <Reveal as="h2" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(32px, 3.5vw, 48px)',
              fontWeight: 700, letterSpacing: '-0.06em', marginBottom: 20,
            }}>
              {"Let's "}
              <span className="gradient-text">Connect</span>
            </Reveal>
            <Reveal as="p" delay={0.08} style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 16,
              lineHeight: 1.75, marginBottom: 48, maxWidth: 440,
            }}>
              Have a question, partnership idea, or feedback? Our team responds within 24 hours.
              We'd love to hear from you.
            </Reveal>

            {/* Contact info items */}
            {[
              { icon: '📧', label: 'Email', value: 'hello@apexnova.gg', color: '#ccff00' },
              { icon: '💬', label: 'Discord', value: 'discord.gg/apexnova', color: '#10b981' },
              { icon: '🐦', label: 'Twitter', value: '@ApexNovaGG', color: '#bef264' },
              { icon: '📍', label: 'HQ', value: 'San Francisco, CA', color: '#ccff00' },
            ].map((item, idx) => (
              <Reveal key={item.label} as="div" delay={0.1 + idx * 0.03} style={{
                display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${item.color}22, ${item.color}0a)`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: item.color }}>
                    {item.value}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Right form */}
          <Reveal as="div" delay={0.08} style={{ height: '100%' }}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="glass-strong"
                  style={{
                    borderRadius: 24, padding: '80px 40px',
                    border: '1px solid rgba(204,255,0,0.3)',
                    background: 'linear-gradient(180deg, rgba(204,255,0,0.03) 0%, rgba(0,0,0,0) 100%)',
                    textAlign: 'center',
                    boxShadow: '0 0 60px -15px rgba(204,255,0,0.2), inset 0 0 20px rgba(204,255,0,0.05)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', minHeight: 480
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(204,255,0,0.1)',
                      border: '2px solid #ccff00',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 28, boxShadow: '0 0 40px rgba(204,255,0,0.4)',
                      position: 'relative'
                    }}
                  >
                    <motion.svg
                      width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccff00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <motion.polyline 
                        points="20 6 9 17 4 12" 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
                      />
                    </motion.svg>
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 28, fontWeight: 800, marginBottom: 16,
                      color: '#ccff00', textShadow: '0 0 20px rgba(204,255,0,0.5)'
                    }}
                  >
                    Transmission Secured
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7, maxWidth: 320 }}
                  >
                    Your message has been beamed to ApexNova HQ. We'll deploy a response to your inbox shortly.
                  </motion.p>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="btn-secondary"
                    style={{ marginTop: 36, padding: '12px 28px', borderRadius: 999, borderColor: 'rgba(204,255,0,0.4)' }}
                    data-cursor="hover"
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  >
                    Deploy Another
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="glass-strong"
                  style={{
                    borderRadius: 24, padding: '40px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minHeight: 480
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
                      Full Name
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
                      Email Address
                    </label>
                    <input
                      className="form-input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
                    Subject
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="subject"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
                    Message
                  </label>
                  <textarea
                    className="form-input"
                    name="message"
                    rows={5}
                    placeholder="Tell us more..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    style={{ resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', fontSize: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  disabled={loading}
                  data-cursor="hover"
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'rotateGlow 0.7s linear infinite',
                      }} />
                      Sending...
                    </>
                  ) : '📨 Send Message'}
                </button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #contact .container > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Contact;
