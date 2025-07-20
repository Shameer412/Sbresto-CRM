import React, { useState, useEffect } from 'react';
import { useGetSalespeopleQuery } from '../../features/api/apiSlice';
import {
  useGetAvailableLeadSlotsQuery,
  useBookLeadMeetingMutation
} from '../../features/calender/scheduleApiSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUser, FiClock, FiChevronRight, FiCalendar, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { GiTimeBomb } from 'react-icons/gi';

const ScheduleMeeting = () => {
  // Data fetching
  const { data: users, isLoading: loadingUsers } = useGetSalespeopleQuery();
  const usersArray = users?.data?.data || [];
  const salesUsers = usersArray;

  // State management
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [gridDaysOffset, setGridDaysOffset] = useState(0);

  // Query available slots
  const leadId = selectedUser?.id;
  const formattedDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
  const { data: slotData, isLoading: loadingSlots } = useGetAvailableLeadSlotsQuery(
    leadId && formattedDate ? { leadId, date: formattedDate } : skipToken
  );
  const slots = slotData?.available_slots || [];

  // Booking mutation
  const [bookMeeting, { isLoading: booking }] = useBookLeadMeetingMutation();

  // Calendar utilities
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    const totalCells = days.length;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) for (let i = 0; i < remainingCells; i++) days.push(null);
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const generateCalendarDays = (offset = 0) => {
    const days = [];
    const today = new Date();
    for (let i = offset; i < offset + 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const calendarDays = generateCalendarDays(gridDaysOffset);

  const trimTime = (time) => time ? time.slice(0, 5) : '';

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

  // ANIMATION VARIANTS
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen py-4 px-2 sm:px-4 lg:px-8">
      {/* BG Gradient */}
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
        className="w-full max-w-3xl lg:max-w-6xl mx-auto"
      >
        <div className="glass bg-gray-900/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-700/50 shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-gray-700/50">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                TimeSync
              </span>
            </h1>
            <p className="text-gray-300 mt-1 sm:mt-2 text-base sm:text-lg">
              Schedule your perfect meeting moment
            </p>
          </div>
          {/* Progress Steps */}
          <div className="flex justify-between px-2 sm:px-8 pt-4 sm:pt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
                  ${activeStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {step}
                </div>
                <div className={`text-xs mt-1 sm:mt-2 ${activeStep >= step ? 'text-blue-400' : 'text-gray-500'}`}>
                  {step === 1 ? 'Person' : step === 2 ? 'Date' : 'Time'}
                </div>
              </div>
            ))}
          </div>
          {/* Content Area */}
          <div className="p-2 sm:p-4 md:p-8">
            {/* Step 1: Select Person */}
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <FiUser className="mr-2 text-blue-400" />
                    Who would you like to meet with?
                  </h2>
                  {loadingUsers ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 sm:h-24 bg-gray-800/50 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                      {salesUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all 
                            ${selectedUser?.id === user.id
                              ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-blue-400/50'
                              : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'}`}
                          onClick={() => {
                            setSelectedUser(user);
                            setActiveStep(2);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-white text-base">{user.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-400">Sales Executive</p>
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
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                      <FiCalendar className="mr-2 text-blue-400" />
                      When would you like to meet?
                    </h2>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          viewMode === 'grid'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        }`}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          viewMode === 'calendar'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        }`}
                      >
                        Calendar
                      </button>
                    </div>
                  </div>
                  {viewMode === 'grid' ? (
                    <div className="space-y-4">
                      {/* Grid Navigation */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setGridDaysOffset(Math.max(0, gridDaysOffset - 7))}
                          disabled={gridDaysOffset === 0}
                          className={`px-2 py-1 rounded-lg text-xs transition flex items-center
                            ${gridDaysOffset === 0
                              ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                              : 'bg-gray-800/50 hover:bg-gray-700/50 text-white'}`}
                        >
                          <FiChevronLeft className="mr-1" /> Prev
                        </button>
                        <span className="text-xs sm:text-sm text-gray-400">
                          {calendarDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                          {calendarDays[calendarDays.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={() => setGridDaysOffset(gridDaysOffset + 7)}
                          className="px-2 py-1 rounded-lg text-xs bg-gray-800/50 hover:bg-gray-700/50 text-white transition flex items-center"
                        >
                          Next <FiChevronRight className="ml-1" />
                        </button>
                      </div>
                      {/* Responsive scroll for days */}
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-7 gap-2 overflow-x-auto">
                        {calendarDays.map((day, index) => {
                          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                          const isToday = day.toDateString() === new Date().toDateString();
                          return (
                            <motion.div
                              key={`${day.getTime()}-${index}`}
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
                    </div>
                  ) : (
                    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden w-full overflow-x-auto">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between p-2 sm:p-4 bg-gray-800/50 border-b border-gray-700/50">
                        <button
                          onClick={() => navigateMonth(-1)}
                          className="p-1 sm:p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition"
                        >
                          <FiChevronLeft className="text-white" />
                        </button>
                        <h3 className="text-sm sm:text-lg font-semibold text-white">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => navigateMonth(1)}
                          className="p-1 sm:p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition"
                        >
                          <FiChevronRight className="text-white" />
                        </button>
                      </div>
                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-400 py-1 sm:py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth).map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="h-8 sm:h-10"></div>;
                          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                          const isToday = day.toDateString() === new Date().toDateString();
                          const isDisabled = isDateDisabled(day);
                          return (
                            <motion.button
                              key={`${day.getTime()}-${index}`}
                              whileHover={!isDisabled ? { scale: 1.05 } : {}}
                              whileTap={!isDisabled ? { scale: 0.95 } : {}}
                              disabled={isDisabled}
                              className={`h-8 sm:h-10 w-full rounded-lg flex items-center justify-center text-xs sm:text-sm transition-all
                                ${isSelected
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                                  : isToday && !isDisabled
                                    ? 'bg-blue-500/20 border border-blue-400 text-blue-300'
                                    : isDisabled
                                      ? 'text-gray-600 cursor-not-allowed'
                                      : 'text-gray-300 hover:bg-gray-700/50'}`}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedDate(day);
                                  setActiveStep(3);
                                }
                              }}
                            >
                              {day.getDate()}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-3">
                    <button
                      onClick={() => setActiveStep(1)}
                      className="px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition flex items-center text-xs sm:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => selectedDate && setActiveStep(3)}
                      disabled={!selectedDate}
                      className={`px-3 py-2 rounded-lg text-white transition flex items-center text-xs sm:text-base
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
                  className="space-y-4 sm:space-y-6"
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <FiClock className="mr-2 text-blue-400" />
                    Available Time Slots for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  {loadingSlots ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 sm:h-16 bg-gray-800/50 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 sm:p-8 text-center bg-gray-900/30 rounded-xl border border-gray-700/50">
                      <GiTimeBomb className="mx-auto text-2xl sm:text-4xl text-gray-500 mb-2 sm:mb-3" />
                      <h3 className="text-base sm:text-lg text-white">No available slots</h3>
                      <p className="text-gray-400 mt-1">Please try another date</p>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="mt-4 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition text-xs sm:text-base"
                      >
                        Back to Calendar
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-2 sm:space-y-3"
                    >
                      {slots.map((slot, idx) => (
                        <motion.div
                          key={idx}
                          variants={itemVariants}
                          whileHover={{ scale: 1.01 }}
                          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 border border-gray-700/50 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition"></div>
                          <div className="relative p-3 sm:p-4 flex flex-col xs:flex-row justify-between items-start xs:items-center">
                            <div className="flex items-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mr-3">
                                <FiClock className="text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-white text-base">
                                  {trimTime(slot.start_time)} - {trimTime(slot.end_time)}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  Duration: {Math.abs(new Date(`2000-01-01T${slot.end_time}`) - new Date(`2000-01-01T${slot.start_time}`)) / (1000 * 60)} mins
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBook(slot)}
                              disabled={booking}
                              className="mt-3 xs:mt-0 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition flex items-center text-xs sm:text-base"
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
                  <div className="flex justify-between pt-3">
                    <button
                      onClick={() => setActiveStep(2)}
                      className="px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 text-white transition flex items-center text-xs sm:text-base"
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
