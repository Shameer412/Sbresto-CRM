import React, { useState, useEffect } from 'react';
import { useGetLeadUsersQuery } from '../../features/leads/leadsApiSlice';
import {
  useGetAvailableLeadSlotsQuery,
  useBookLeadMeetingMutation
} from '../../features/calender/scheduleApiSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiClock, FiChevronRight, FiCalendar, FiCheck } from 'react-icons/fi';
import { GiTimeBomb } from 'react-icons/gi';

const ScheduleMeeting = () => {
  // Data fetching
  const { data: users, isLoading: loadingUsers } = useGetLeadUsersQuery();
  const usersArray = users?.data?.data || [];
  const salesUsers = usersArray;

  // State management
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  // Query available slots
  const leadId = selectedUser?.id;
  const formattedDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
  const { data: slotData, isLoading: loadingSlots } = useGetAvailableLeadSlotsQuery(
    leadId && formattedDate ? { leadId, date: formattedDate } : skipToken
  );
  const slots = slotData?.available_slots || [];

  // Booking mutation
  const [bookMeeting, { isLoading: booking }] = useBookLeadMeetingMutation();

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Utility functions
  const trimTime = (time) => time ? time.slice(0, 5) : '';

  // Booking handler with toast notifications
  const handleBook = async (slot) => {
    if (!leadId || !(slot.date || formattedDate)) return;
    
    const toastId = toast.loading('Securing your time slot...', {
      position: 'top-center',
      theme: 'dark',
      className: 'toast-glass'
    });
    
    try {
      await bookMeeting({
        leadId,
        date: slot.date || formattedDate,
        start_time: trimTime(slot.start_time),
        end_time: trimTime(slot.end_time),
      }).unwrap();
      
      toast.update(toastId, {
        render: 'Time slot booked successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        hideProgressBar: false,
        className: 'toast-glass-success'
      });
    } catch (err) {
      toast.update(toastId, {
        render: 'Booking failed: ' + (err?.data?.message || err.message),
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        className: 'toast-glass-error'
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Background particles effect
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.15';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = window.innerWidth < 768 ? 30 : 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 - 0.5,
        color: `rgba(100, 200, 255, ${Math.random() * 0.5})`
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      document.body.removeChild(canvas);
    };
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 -z-10"></div>
      
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="glass bg-gray-800/80 backdrop-blur-md"
        progressClassName="bg-blue-500"
      />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="glass bg-gray-900/50 backdrop-blur-lg rounded-3xl overflow-hidden border border-gray-700/50 shadow-2xl">
          {/* Header */}
          <div className="p-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700/50">
            <h1 className="text-3xl font-bold text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                TimeSync
              </span>
            </h1>
            <p className="text-gray-300 mt-2">Schedule your perfect meeting moment</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between px-8 pt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${activeStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {step}
                </div>
                <div className={`text-xs mt-2 ${activeStep >= step ? 'text-blue-400' : 'text-gray-500'}`}>
                  {step === 1 ? 'Person' : step === 2 ? 'Date' : 'Time'}
                </div>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Step 1: Select Person */}
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <FiUser className="mr-2 text-blue-400" />
                    Who would you like to meet with?
                  </h2>
                  
                  {loadingUsers ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {salesUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl cursor-pointer transition-all 
                            ${selectedUser?.id === user.id 
                              ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-blue-400/50' 
                              : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'}`}
                          onClick={() => {
                            setSelectedUser(user);
                            setActiveStep(2);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{user.name}</h3>
                              <p className="text-sm text-gray-400">Sales Executive</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2: Select Date */}
            <AnimatePresence mode="wait">
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FiCalendar className="mr-2 text-blue-400" />
                      When would you like to meet?
                    </h2>
                    <button 
                      onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
                      className="text-xs bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50 hover:bg-gray-700/50 transition"
                    >
                      {viewMode === 'grid' ? 'Timeline View' : 'Calendar View'}
                    </button>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => {
                        const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-2 rounded-lg cursor-pointer text-center transition-all
                              ${isSelected 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                                : isToday 
                                  ? 'bg-gray-700/50 border border-blue-400/30' 
                                  : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                            onClick={() => {
                              setSelectedDate(day);
                              setActiveStep(3);
                            }}
                          >
                            <div className="text-xs font-medium">
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-lg font-bold my-1">
                              {day.getDate()}
                            </div>
                            <div className="text-xs opacity-70">
                              {day.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="relative h-64 overflow-hidden rounded-xl bg-gray-900/50 border border-gray-700/50">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-900/80 to-transparent z-10"></div>
                      <div className="absolute inset-0 flex items-center">
                        {calendarDays.map((day, index) => {
                          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                          const isToday = day.toDateString() === new Date().toDateString();
                          
                          return (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`h-40 w-16 mx-1 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all
                                ${isSelected 
                                  ? 'bg-gradient-to-b from-blue-500 to-purple-500 text-white shadow-lg' 
                                  : isToday 
                                    ? 'bg-gray-700/50 border border-blue-400/30' 
                                    : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                              onClick={() => {
                                setSelectedDate(day);
                                setActiveStep(3);
                              }}
                              style={{ zIndex: isSelected ? 20 : 10 }}
                            >
                              <div className="text-xs font-medium">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-xl font-bold my-2">
                                {day.getDate()}
                              </div>
                              <div className="text-xs opacity-70">
                                {day.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition flex items-center"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => selectedDate && setActiveStep(3)}
                      disabled={!selectedDate}
                      className={`px-4 py-2 rounded-lg text-white transition flex items-center
                        ${selectedDate 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                          : 'bg-gray-800/30 cursor-not-allowed'}`}
                    >
                      Next <FiChevronRight className="ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Select Time */}
            <AnimatePresence mode="wait">
              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <FiClock className="mr-2 text-blue-400" />
                    Available Time Slots for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  
                  {loadingSlots ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-8 text-center bg-gray-900/30 rounded-xl border border-gray-700/50">
                      <GiTimeBomb className="mx-auto text-4xl text-gray-500 mb-3" />
                      <h3 className="text-lg text-white">No available slots</h3>
                      <p className="text-gray-400 mt-1">Please try another date</p>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="mt-4 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition"
                      >
                        Back to Calendar
                      </button>
                    </div>
                  ) : (
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {slots.map((slot, idx) => (
                        <motion.div
                          key={idx}
                          variants={itemVariants}
                          whileHover={{ scale: 1.01 }}
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 border border-gray-700/50 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition"></div>
                          <div className="relative p-4 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mr-4">
                                <FiClock className="text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-white">
                                  {trimTime(slot.start_time)} - {trimTime(slot.end_time)}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  Duration: {Math.abs(new Date(`2000-01-01T${slot.end_time}`) - new Date(`2000-01-01T${slot.start_time}`)) / (1000 * 60)} mins
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBook(slot)}
                              disabled={booking}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition flex items-center"
                            >
                              {booking ? 'Booking...' : (
                                <>
                                  <FiCheck className="mr-2" />
                                  Confirm
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setActiveStep(2)}
                      className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition flex items-center"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleMeeting;