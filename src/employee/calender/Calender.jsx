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
  const { data: users, isLoading: loadingUsers } = useGetSalespeopleQuery();
  const usersArray = users?.data?.data || [];
  const salesUsers = usersArray;
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [gridDaysOffset, setGridDaysOffset] = useState(0);
  const leadId = selectedUser?.id;
  const formattedDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
  const { data: slotData, isLoading: loadingSlots } = useGetAvailableLeadSlotsQuery(
    leadId && formattedDate ? { leadId, date: formattedDate } : skipToken
  );
  const slots = slotData?.available_slots || [];
  const [bookMeeting, { isLoading: booking }] = useBookLeadMeetingMutation();

  // Unchanged calendar utilities (getDaysInMonth, navigateMonth, isDateDisabled, generateCalendarDays, trimTime)
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
      theme: 'light',
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
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 - 0.5,
        color: `rgba(100, 150, 255, ${Math.random() * 0.15 + 0.1})`
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
    <div className="min-h-screen py-4 px-2 sm:px-4 lg:px-8 bg-white">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="bg-white/90 backdrop-blur-md shadow-md"
        progressClassName="bg-blue-500"
      />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl lg:max-w-6xl mx-auto"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
          <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-blue-100 to-teal-100 border-b border-gray-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">
                TimeSync
              </span>
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">
              Schedule your perfect meeting moment
            </p>
          </div>
          <div className="flex justify-between px-2 sm:px-8 pt-4 sm:pt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
                  ${activeStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step}
                </div>
                <div className={`text-xs mt-1 sm:mt-2 ${activeStep >= step ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step === 1 ? 'Person' : step === 2 ? 'Date' : 'Time'}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 sm:p-4 md:p-8">
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
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                    <FiUser className="mr-2 text-blue-500" />
                    Who would you like to meet with?
                  </h2>
                  {loadingUsers ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 sm:h-24 bg-gray-100 rounded-xl animate-pulse"></div>
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
                              ? 'bg-blue-50 border-2 border-blue-300'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                          onClick={() => {
                            setSelectedUser(user);
                            setActiveStep(2);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 text-base">{user.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-500">Sales Executive</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                      <FiCalendar className="mr-2 text-blue-500" />
                      When would you like to meet?
                    </h2>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          viewMode === 'grid'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`text-xs px-2 py-1 rounded-full border transition ${
                          viewMode === 'calendar'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        Calendar
                      </button>
                    </div>
                  </div>
                  {viewMode === 'grid' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setGridDaysOffset(Math.max(0, gridDaysOffset - 7))}
                          disabled={gridDaysOffset === 0}
                          className={`px-2 py-1 rounded-lg text-xs transition flex items-center
                            ${gridDaysOffset === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'}`}
                        >
                          <FiChevronLeft className="mr-1" /> Prev
                        </button>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {calendarDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                          {calendarDays[calendarDays.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={() => setGridDaysOffset(gridDaysOffset + 7)}
                          className="px-2 py-1 rounded-lg text-xs bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 transition flex items-center"
                        >
                          Next <FiChevronRight className="ml-1" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-7 gap-2 overflow-x-auto">
                        {calendarDays.map((day, index) => {
                          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                          const isToday = day.toDateString() === new Date().toDateString();
                          return (
                            <motion.div
                              key={`${day.getTime()}-${index}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-2 rounded-lg cursor-pointer transition-all
                                ${isSelected
                                  ? 'bg-blue-500 text-white'
                                  : isToday
                                    ? 'bg-blue-100 border border-blue-300 text-gray-900'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-900'}`}
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
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full overflow-x-auto">
                      <div className="flex items-center justify-between p-2 sm:p-4 bg-gray-50 border-b border-gray-200">
                        <button
                          onClick={() => navigateMonth(-1)}
                          className="p-1 sm:p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition"
                        >
                          <FiChevronLeft className="text-gray-900" />
                        </button>
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => navigateMonth(1)}
                          className="p-1 sm:p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition"
                        >
                          <FiChevronRight className="text-gray-900" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2">
                            {day}
                          </div>
                        ))}
                      </div>
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
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : isToday && !isDisabled
                                    ? 'bg-blue-100 border border-blue-300 text-gray-900'
                                    : isDisabled
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-900 hover:bg-gray-50'}`}
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
                  <div className="flex justify-between pt-3">
                    <button
                      onClick={() => setActiveStep(1)}
                      className="px-3 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-900 transition flex items-center text-xs sm:text-base"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => selectedDate && setActiveStep(3)}
                      disabled={!selectedDate}
                      className={`px-3 py-2 rounded-lg text-white transition flex items-center text-xs sm:text-base
                        ${selectedDate
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-200 cursor-not-allowed text-gray-500'}`}
                    >
                      Next <FiChevronRight className="ml-1" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                    <FiClock className="mr-2 text-blue-500" />
                    Available Time Slots for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  {loadingSlots ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 sm:h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 sm:p-8 text-center bg-white rounded-xl border border-gray-200">
                      <GiTimeBomb className="mx-auto text-2xl sm:text-4xl text-gray-400 mb-2 sm:mb-3" />
                      <h3 className="text-base sm:text-lg text-gray-900">No available slots</h3>
                      <p className="text-gray-600 mt-1">Please try another date</p>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="mt-4 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-900 transition text-xs sm:text-base"
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
                          className="group relative overflow-hidden rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all"
                        >
                          <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-10 transition"></div>
                          <div className="relative p-3 sm:p-4 flex flex-col xs:flex-row justify-between items-start xs:items-center">
                            <div className="flex items-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                                <FiClock className="text-blue-500" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900 text-base">
                                  {trimTime(slot.start_time)} - {trimTime(slot.end_time)}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Duration: {Math.abs(new Date(`2000-01-01T${slot.end_time}`) - new Date(`2000-01-01T${slot.start_time}`)) / (1000 * 60)} mins
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBook(slot)}
                              disabled={booking}
                              className="mt-3 xs:mt-0 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center text-xs sm:text-base"
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
                      className="px-3 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-900 transition flex items-center text-xs sm:text-base"
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