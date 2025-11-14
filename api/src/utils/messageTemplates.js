const templates = {
  booking_confirmation: {
    name: 'booking_confirmation',
    generate: ({ customerName, phone, appointmentTime, barberName }) => {
      return `🔔 New Booking Alert!\n\nCustomer: ${customerName}\nPhone: ${phone}\nAppointment: ${appointmentTime}\n${barberName ? `Barber: ${barberName}` : ''}\n\nPlease confirm this booking.`;
    },
  },
  booking_reminder: {
    name: 'booking_reminder',
    generate: ({ customerName, appointmentTime }) => {
      return `👋 Reminder: You have an appointment scheduled for ${appointmentTime}.\n\nCustomer: ${customerName}\n\nSee you soon!`;
    },
  },
  booking_cancellation: {
    name: 'booking_cancellation',
    generate: ({ customerName, appointmentTime }) => {
      return `❌ Booking Cancelled\n\nCustomer: ${customerName}\nAppointment: ${appointmentTime}\n\nThis appointment has been cancelled.`;
    },
  },
};

const generateMessage = (templateName, data) => {
  const template = templates[templateName];
  
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  return template.generate(data);
};

const getTemplateNames = () => Object.keys(templates);

module.exports = {
  templates,
  generateMessage,
  getTemplateNames,
};
