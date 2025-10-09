import { useState, useRef, useEffect } from 'react';

export default function TourChatbot() {
  const [messages, setMessages] = useState([
    {
      text: "👋 Hello! I'm your AI Tour Assistant. I can help you with tour destinations, bookings, payments, and travel advice. Ask me anything about tours!",
      isUser: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [statusMessage, setStatusMessage] = useState('');

  const chatMessagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  // English knowledge base with questions and answers
  const knowledgeBaseEn = {
    'hello': 'Hello! 👋 Welcome to our tour service. How can I help you today?',
    'hi': 'Hi there! 👋 I\'m here to assist you with tour information. What would you like to know?',
    'hey': 'Hey! 👋 Ready to explore amazing destinations? Ask me anything!',
    'good morning': 'Good morning! ☀️ How can I help you plan your perfect tour today?',
    'good afternoon': 'Good afternoon! 🌤️ What tour information can I provide for you?',
    'good evening': 'Good evening! 🌆 How may I assist you with your travel plans?',
    'destinations': '🌍 Popular Destinations:\n\n• Paris, France - Eiffel Tower & Museums\n• Bali, Indonesia - Beaches & Temples\n• Tokyo, Japan - Culture & Technology\n• New York, USA - City Life & Landmarks\n• Dubai, UAE - Luxury & Desert Safari\n• Maldives - Islands & Water Sports\n• Switzerland - Alps & Scenic Beauty\n• Thailand - Temples & Street Food\n\nWhich destination interests you?',
    'paris': '🗼 Paris Tours:\n\n• Eiffel Tower Visit - $50\n• Louvre Museum - $35\n• Seine River Cruise - $40\n• Versailles Palace - $65\n• 3-Day Package - $200\n\nDuration: 1-3 days\nBest Season: April-October\nIncludes: Guide, Transport, Entry Fees',
    'bali': '🏖️ Bali Tours:\n\n• Beach Hopping - $60\n• Temple Tour - $45\n• Rice Terrace Trek - $40\n• Water Sports - $70\n• 5-Day Package - $350\n\nDuration: 3-7 days\nBest Season: April-October\nIncludes: Hotel, Meals, Activities',
    'tokyo': '🗾 Tokyo Tours:\n\n• City Highlights - $80\n• Mount Fuji Day Trip - $120\n• Traditional Tea Ceremony - $50\n• Shibuya & Harajuku - $60\n• 4-Day Package - $450\n\nDuration: 2-5 days\nBest Season: March-May, Sept-Nov\nIncludes: Guide, Transport, Some Meals',
    'dubai': '🏙️ Dubai Tours:\n\n• Burj Khalifa - $75\n• Desert Safari - $90\n• Dubai Mall & Fountain - $50\n• Palm Jumeirah - $65\n• 3-Day Package - $400\n\nDuration: 2-4 days\nBest Season: Nov-March\nIncludes: Luxury Hotel, All Activities',
    'maldives': '🏝️ Maldives Tours:\n\n• Island Hopping - $150\n• Snorkeling Adventure - $100\n• Sunset Cruise - $80\n• Water Villa Stay - $300/night\n• 5-Day Package - $1200\n\nDuration: 4-7 days\nBest Season: Nov-April\nIncludes: Resort, Meals, Water Sports',
    'book': '📅 How to Book:\n\n1. Browse destinations & choose tour\n2. Select dates & number of travelers\n3. Fill booking form with details\n4. Make payment (multiple options available)\n5. Receive confirmation via email\n6. Get itinerary & travel documents\n\nNeed help with a specific step?',
    'booking': '📅 Booking Process:\n\n✅ Easy 3-Step Process:\n1. Select your tour package\n2. Choose dates and travelers\n3. Complete payment\n\nBooking time: 5-10 minutes\nConfirmation: Instant\n\nReady to book? Login to get started!',
    'how to book': '📝 Booking Steps:\n\n1. Login to your account\n2. Browse tours or search destination\n3. Click "Book Now" on chosen tour\n4. Fill traveler details\n5. Select payment method\n6. Confirm & pay\n7. Download ticket & itinerary\n\nNeed assistance? Contact support!',
    'payment': '💳 Payment Options:\n\n• Credit/Debit Cards (Visa, Mastercard, Amex)\n• UPI (Google Pay, PhonePe, Paytm)\n• Net Banking\n• Digital Wallets\n• Pay Later (EMI available)\n• Cash (at office only)\n\n🔒 All payments are 100% secure\n💰 Flexible EMI options available',
    'price': '💰 Our tours range from $50 to $2000 depending on:\n\n• Destination\n• Duration (1-14 days)\n• Accommodation type\n• Activities included\n• Season (peak/off-peak)\n\nShare your destination for exact pricing!',
    'cost': '💵 Tour Costs:\n\n• Budget Tours: $50-$200\n• Standard Tours: $200-$500\n• Premium Tours: $500-$1000\n• Luxury Tours: $1000+\n\nIncludes: Stay, meals, transport, guide\nWhich budget suits you?',
    'cancel': '❌ Cancellation Policy:\n\n• 30+ days before: 100% refund\n• 15-29 days: 75% refund\n• 7-14 days: 50% refund\n• 3-6 days: 25% refund\n• Less than 3 days: No refund\n\nEmergencies considered case-by-case\nProcess time: 5-7 business days',
    'refund': '💸 Refund Policy:\n\n✅ Full refund if:\n• Cancelled 30+ days before\n• Tour cancelled by us\n• Service not as promised\n\n⏱️ Partial refunds based on timing\n📧 Request via email with booking ID\n⏰ Processed within 7-10 days',
    'group': '👥 Group Bookings:\n\n✨ Special Benefits:\n• 10+ people: 10% discount\n• 20+ people: 15% discount\n• 30+ people: 20% discount\n• Free tour coordinator\n• Customizable itinerary\n• Flexible payment terms\n\nContact us for group quotes!',
    'family': '👨‍👩‍👧‍👦 Family Packages:\n\n❤️ Perfect for families!\n• Kid-friendly activities\n• Family rooms available\n• Child discounts (50% under 12)\n• Safety prioritized\n• Flexible schedules\n• Fun for all ages\n\nPopular: Bali, Dubai, Thailand',
    'visa': '📋 Visa & Documents:\n\n✈️ Required:\n• Valid passport (6+ months)\n• Visa (if required - we assist!)\n• Travel insurance (recommended)\n• Vaccination certificate (some countries)\n• Return tickets\n• Hotel bookings\n\nWe help with visa applications!',
    'passport': '🛂 Passport Requirements:\n\n✅ Must have:\n• Valid for 6+ months from travel date\n• At least 2 blank pages\n• Not damaged or torn\n• Clear photo page\n\n❌ Expired passports not accepted\n⏰ Renewal takes 2-4 weeks',
    'tips': '💡 Travel Tips:\n\n✨ Pack Smart:\n• Check weather forecast\n• Comfortable walking shoes\n• Universal adapter\n• Photocopies of documents\n• Basic medicines\n• Local currency\n\n📱 Download offline maps\n🔋 Keep power bank handy',
    'safety': '🛡️ Safety Guidelines:\n\n✅ Stay Safe:\n• Keep valuables secure\n• Stay with group\n• Share itinerary with family\n• Emergency contacts saved\n• Travel insurance recommended\n• Follow local laws\n• Stay hydrated\n\n🚨 24/7 support available',
    'contact': '📞 Contact Us:\n\n📧 Email: support@toursmanager.com\n📱 Phone: +1-800-TOURS-24\n💬 Live Chat: Available 24/7\n🏢 Office: 123 Travel Street, City\n⏰ Working: Mon-Sat, 9AM-6PM\n\n🌐 Visit: www.toursmanager.com',
    'support': '🆘 Customer Support:\n\n✅ We\'re here 24/7!\n• Live Chat\n• Email Support\n• Phone Support\n• WhatsApp\n• Social Media\n\nAverage response: Under 5 minutes\nHappy to help anytime!',
    'help': '❓ How Can I Help?\n\nI can assist with:\n✅ Destination information\n✅ Booking process\n✅ Payment options\n✅ Cancellation policy\n✅ Group bookings\n✅ Visa requirements\n✅ Travel tips\n✅ Contact details\n\nWhat would you like to know?',
    'login': '🔐 Login Information:\n\n✅ To access all features:\n1. Click "Login" button\n2. Enter email & password\n3. Or use Google/Facebook login\n\n🆕 New user? Click "Sign Up"\n🔑 Forgot password? Click "Reset"\n\n🎁 Create account for exclusive deals!',
    'account': '👤 Account Features:\n\n✨ With an account you get:\n• Booking history\n• Saved destinations\n• Faster checkout\n• Exclusive discounts\n• Priority support\n• Loyalty points\n\nSign up now - it\'s free!',
    'best time': '📅 Best Time to Travel:\n\n🌸 Spring (Mar-May): Europe, Japan\n☀️ Summer (Jun-Aug): Europe, USA\n🍂 Fall (Sep-Nov): Asia, Americas\n❄️ Winter (Dec-Feb): Tropical destinations\n\nEach destination has its ideal season!',
    'insurance': '🛡️ Travel Insurance:\n\n✅ Highly Recommended!\nCovers:\n• Medical emergencies\n• Trip cancellation\n• Lost baggage\n• Flight delays\n• Accidents\n\n💰 Cost: $30-100 per trip\n📝 We can arrange for you!',
    'covid': '😷 COVID-19 Guidelines:\n\n✅ Current Requirements:\n• Check destination rules\n• Vaccination may be required\n• Masks in some places\n• Travel insurance recommended\n\n📋 Requirements change - we keep you updated!',
    'thank': 'You\'re welcome! 😊 Happy to help! Is there anything else you\'d like to know about our tours?',
    'thanks': 'You\'re welcome! 🙏 Feel free to ask if you need more information!',
    'bye': 'Goodbye! 👋 Have a wonderful day! Come back anytime for tour information!',
    'goodbye': 'Goodbye! ✈️ Safe travels and see you soon!',
    'tour': '🎯 Tours Available:\n\nWe offer tours to 50+ destinations worldwide! Popular categories:\n• Beach & Islands\n• Historical & Cultural\n• Adventure & Trekking\n• City Tours\n• Luxury Experiences\n• Family Packages\n\nWhich type interests you?',
    'package': '📦 Tour Packages:\n\n✨ Choose from:\n• Weekend Getaways (2-3 days)\n• Week-long Adventures (7 days)\n• Extended Tours (10-14 days)\n• Custom Packages\n\nAll inclusive with stay, meals, transport & guide!\nWhich duration works for you?'
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // Stop previous recognition if any
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore if not started
        }
      }

      // Create new recognition instance with updated language
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognition language:', recognitionRef.current.lang);
        setInputValue(transcript);
        setTimeout(() => handleSendMessage(transcript), 100);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showStatus('❌ Voice error. Please try again.', 3000);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  // Removed redundant useEffect that only updated recognitionRef.current.lang
  // useEffect(() => {
  //   if (recognitionRef.current) {
  //     recognitionRef.current.lang = language;
  //   }
  // }, [language]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const showStatus = (message, duration = 2000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), duration);
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice input not supported. Please use Chrome or Edge browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      showStatus('🎤 Listening...');
    }
  };

  const speakMessage = (text) => {
    if (!synthesisRef.current) {
      alert('Text-to-speech not supported in this browser.');
      return;
    }

    synthesisRef.current.cancel();

    const cleanText = text.replace(/[🌍📅💳🔐❌💬🛡️👥✅⏱️📦👋🚀🤖🎤⚠️🗼🏖️🗾🏙️🏝️📝💰💵💸🛂💡🆘❓🔑👤📋😷🎯✨☀️🌸🍂❄️🆕🙏😊✈️🌤️🌆📧📱🏢🌐🔒💡📞]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    synthesisRef.current.speak(utterance);
  };

  // Function to get bot response based on selected language
  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();

    // Get response from English knowledge base
    for (const [key, value] of Object.entries(knowledgeBaseEn)) {
      if (message.includes(key)) {
        if (language.startsWith('ta')) {
          // Basic Tamil translations for common responses
          const tamilTranslations = {
            'Hello! 👋 Welcome to our tour service. How can I help you today?': 'வணக்கம்! 👋 எங்கள் சுற்றுலா சேவைக்கு வரவேற்கிறோம். இன்று எப்படி உதவலாம்?',
            'Hi there! 👋 I\'m here to assist you with tour information. What would you like to know?': 'ஹாய்! 👋 சுற்றுலா தகவலுக்கு நான் உதவ தயாராக இருக்கிறேன். என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?',
            'Hey! 👋 Ready to explore amazing destinations? Ask me anything!': 'ஹே! 👋 அற்புதமான இடங்களை ஆராய தயாரா? எதையும் கேளுங்கள்!',
            'Good morning! ☀️ How can I help you plan your perfect tour today?': 'காலை வணக்கம்! ☀️ இன்று உங்கள் சரியான சுற்றுலாவை திட்டமிட உதவலாமா?',
            'Good afternoon! 🌤️ What tour information can I provide for you?': 'மதிய வணக்கம்! 🌤️ எந்த சுற்றுலா தகவலை உங்களுக்கு வழங்கலாம்?',
            'Good evening! 🌆 How may I assist you with your travel plans?': 'மாலை வணக்கம்! 🌆 உங்கள் பயண திட்டங்களுக்கு எப்படி உதவலாம்?',
            'You\'re welcome! 😊 Happy to help! Is there anything else you\'d like to know about our tours?': 'நன்றி! 😊 உதவ சந்தோஷமாக இருக்கிறது! எங்கள் சுற்றுலாக்களைப் பற்றி வேறு ஏதேனும் தெரிந்து கொள்ள விரும்புகிறீர்களா?',
            'You\'re welcome! 🙏 Feel free to ask if you need more information!': 'நன்றி! 🙏 மேலும் தகவல் தேவைப்பட்டால் கேளுங்கள்!',
            'Goodbye! 👋 Have a wonderful day! Come back anytime for tour information!': 'பிரியாவிடை! 👋 அற்புதமான நாள்! சுற்றுலா தகவலுக்கு எப்போதும் வரலாம்!',
            'Goodbye! ✈️ Safe travels and see you soon!': 'பிரியாவிடை! ✈️ பாதுகாப்பான பயணம், விரைவில் சந்திப்போம்!'
          };
          return tamilTranslations[value] || value;
        }
        return value;
      }
    }

    if (language.startsWith('ta')) {
      return "🤔 அந்த குறிப்பிட்ட கேள்விக்கு எனக்கு தெரியவில்லை. ஆனால் நான் உதவலாம்:\n\n• சுற்றுலா இடங்கள் மற்றும் பாக்கேஜ்கள்\n• புக் செய்யும் செயல்முறை\n• கட்டண விருப்பங்கள்\n• ரத்து கொள்கை\n• குழு புக் செய்தல்\n• விசா தேவைகள்\n• பயண குறிப்புகள்\n\nஇந்த தலைப்புகளில் ஏதேனும் கேளுங்கள்!";
    }

    return "🤔 I'm not sure about that specific question. But I can help you with:\n\n• Tour destinations & packages\n• Booking process\n• Payment options\n• Cancellation policy\n• Group bookings\n• Visa requirements\n• Travel tips\n\nTry asking about any of these topics!";
  };

  const handleSendMessage = async (messageText = inputValue) => {
    const message = messageText.trim();
    if (!message) return;

    setMessages(prev => [...prev, { text: message, isUser: true }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const response = getBotResponse(message);

    setIsTyping(false);
    setMessages(prev => [...prev, { text: response, isUser: false }]);

    // Auto-speak bot response
    setTimeout(() => speakMessage(response), 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={{
      margin: 0,
      boxSizing: 'border-box',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        height: '700px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', fill: 'white' }} viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '2px', margin: 0 }}>AI Tour Assistant</h3>
                <p style={{ fontSize: '11px', opacity: 0.9, margin: 0 }}>🤖 Voice • Multi-language • Smart AI</p>
              </div>
            </div>
            <select
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '15px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                showStatus('✓ Language updated');
              }}
            >
              <option value="en-US">English</option>
              <option value="hi-IN">हिन्दी</option>
              <option value="ta-IN">தமிழ்</option>
              <option value="te-IN">తెలుగు</option>
              <option value="ml-IN">മലയാളം</option>
              <option value="kn-IN">ಕನ್ನಡ</option>
              <option value="mr-IN">मराठी</option>
              <option value="bn-IN">বাংলা</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
              <option value="zh-CN">中文</option>
              <option value="ja-JP">日本語</option>
              <option value="ar-SA">العربية</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatMessagesRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#f5f5f5'
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: '15px',
                display: 'flex',
                gap: '10px',
                animation: 'slideIn 0.3s ease',
                justifyContent: msg.isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {!msg.isUser && (
                <div style={{
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <svg style={{ width: '20px', height: '20px', fill: 'white' }} viewBox="0 0 24 24">
                    <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM12 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                  </svg>
                </div>
              )}

              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '15px',
                wordWrap: 'break-word',
                position: 'relative',
                lineHeight: 1.5,
                background: msg.isUser ? '#667eea' : 'white',
                color: msg.isUser ? 'white' : '#333',
                borderBottomLeftRadius: msg.isUser ? '15px' : '5px',
                borderBottomRightRadius: msg.isUser ? '5px' : '15px',
                whiteSpace: 'pre-line'
              }}>
                {msg.text}
                {!msg.isUser && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      opacity: 0.7
                    }}
                    onClick={() => speakMessage(msg.text)}
                  >
                    <svg style={{ width: '100%', height: '100%', fill: '#667eea' }} viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  </div>
                )}
              </div>

              {msg.isUser && (
                <div style={{
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: '#34d399'
                }}>
                  <svg style={{ width: '20px', height: '20px', fill: 'white' }} viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{
              marginBottom: '15px',
              display: 'flex',
              gap: '10px'
            }}>
              <div style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <svg style={{ width: '20px', height: '20px', fill: 'white' }} viewBox="0 0 24 24">
                  <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM12 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
              </div>
              <div style={{
                padding: '12px 16px',
                background: 'white',
                borderRadius: '15px',
                borderBottomLeftRadius: '5px',
                display: 'flex',
                gap: '5px'
              }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      background: '#667eea',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite',
                      animationDelay: `${i * 0.2}s`
                    }}
                  ></span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '15px 20px',
          background: 'white',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            style={{
              width: '60px',
              height: '60px',
              background: isRecording ? '#ef4444' : '#34d399',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              flexShrink: 0,
              animation: isRecording ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={toggleVoiceRecording}
          >
            <svg style={{ width: '30px', height: '30px', fill: 'white' }} viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>

          <input
            type="text"
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e5e5e5',
              borderRadius: '25px',
              outline: 'none',
              fontSize: '14px',
              transition: 'border-color 0.3s'
            }}
            placeholder="Type or speak your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
          />

          <button
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              flexShrink: 0,
              opacity: isTyping ? 0.5 : 1
            }}
            onClick={() => handleSendMessage()}
            disabled={isTyping}
          >
            <svg style={{ width: '30px', height: '30px', fill: 'white' }} viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

        {statusMessage && (
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#666',
            padding: '5px',
            fontStyle: 'italic'
          }}>
            {statusMessage}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        select option {
          background: #667eea;
          color: white;
        }

        @media (max-width: 480px) {
          .chat-container {
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

