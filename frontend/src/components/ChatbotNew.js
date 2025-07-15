import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Info, ArrowDown, ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { API_URL } from '../config';
import ChatbotFAQ from './ChatbotFAQ';
import './ChatbotNew.css';

// Add these styles to your ChatbotNew.css file
// .message-input-container {
//   padding: 10px;
//   border-top: 1px solid #e0e0e0;
//   background-color: #fff;
// }
// .message-input-form {
//   display: flex;
//   align-items: center;
// }
// .message-input {
//   flex: 1;
//   padding: 10px 15px;
//   border: 1px solid #e0e0e0;
//   border-radius: 20px;
//   font-size: 14px;
//   outline: none;
// }
// .send-button {
//   background: none;
//   border: none;
//   color: #4A6FDC;
//   cursor: pointer;
//   padding: 0 10px;
// }
// .send-button:disabled {
//   color: #ccc;
//   cursor: not-allowed;
// }

const ChatbotNew = ({ isOpen, onClose, onBack }) => {
  // Add navigation state to track current view
  const [viewState, setViewState] = useState('initial'); // 'initial', 'chat', 'faq'
  const [previousView, setPreviousView] = useState(null);
  
  // Store the original conversation history to return to
  const [chatHistory, setChatHistory] = useState([]);

  // Custom back button handler
  const handleBack = () => {
    if (previousView) {
      // Go back to previous view state (FAQ ↔ chat navigation)
      setViewState(previousView);
      setPreviousView(null);
      
      // If returning to chat view and we have stored chat history, restore it
      if (previousView === 'chat' && chatHistory.length > 0) {
        setMessages(chatHistory);
      }
    } else if (chatHistory.length > 0 && messages.length !== chatHistory.length) {
      // If we have frame chat history to return to, restore it
      setMessages(chatHistory);
      setViewState('chat');
    } else if (messages.length > 1) {
      // If we have conversation history but no saved frame, go to initial state
      setMessages([messages[0]]);
      setViewState('initial');
    } else {
      // If no history to go back to, use the provided onBack or close
      if (onBack) onBack();
      else onClose();
    }
  };
  // State for chat messages
  const [messages, setMessages] = useState([
    {
      id: 0,
      type: 'bot',
      content: 'Hello! I\'m your Baguio Pet Boarding assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [currentTopic, setCurrentTopic] = useState(''); // Track current topic for follow-ups
  const [showingFollowUp, setShowingFollowUp] = useState(false); // Track if follow-up is showing
  const [followUpStage, setFollowUpStage] = useState(''); // Track follow-up stage
  const [inputMessage, setInputMessage] = useState('');
  const [showInputField, setShowInputField] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle navigation state and scrolling when messages change
  useEffect(() => {
    scrollToBottom();
    
    // Update view state based on message count
    if (isOpen) {
      if (messages.length === 1) {
        setViewState('initial');
      } else if (messages.length > 1) {
        setViewState('chat');
      }
    }
  }, [isOpen, messages]);

  // Track if user has scrolled up
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  
  // Handle scroll events in the chat container
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
        setIsScrolledUp(!isAtBottom);
      }
    };
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Generate relevant follow-up questions based on the current topic
  const generateRelevantQuestions = (topic) => {
    // Default questions if we can't determine specific ones - only from knowledge base
    let questions = [
      'What services do you offer?',
      'How much do your services cost?'
    ];
  
    // Generate topic-specific questions - only from knowledge base
    const lowerTopic = topic.toLowerCase();
  
    // Pricing related topics
    if (lowerTopic.includes('price') || lowerTopic.includes('cost') || lowerTopic.includes('rate') || 
        lowerTopic.includes('fee') || lowerTopic.includes('payment') || lowerTopic.includes('discount')) {
      questions = [
        'How much do your services cost?',
        'Is there an extra fee for overnight stays?',
  
        'What are your room options for pets?'
      ];
    } 
    // Booking related topics
    else if (lowerTopic.includes('booking') || lowerTopic.includes('reservation') || lowerTopic.includes('reserve') || 
             lowerTopic.includes('schedule') || lowerTopic.includes('appointment')) {
      questions = [
        'How can I book a service?',
        'What is your cancellation policy?',
        'Do you require any documents?'
      ];
    } 
    // Services related topics
    else if (lowerTopic.includes('service') || lowerTopic.includes('offer') || lowerTopic.includes('provide') || 
             lowerTopic.includes('boarding') || lowerTopic.includes('daycare')) {
      questions = [
        'What are your room options for pets?',
        'Do you offer daycare?',
        'What grooming services do you offer?',
        'What pets do you accept?'
      ];
    } 
    // Requirements related topics
    else if (lowerTopic.includes('requirement') || lowerTopic.includes('bring') || lowerTopic.includes('need') || 
             lowerTopic.includes('vaccination') || lowerTopic.includes('document')) {
      questions = [
        'Do you require any documents?',
        'What pets do you accept?'
      ];
    } 
    // Location related topics
    else if (lowerTopic.includes('location') || lowerTopic.includes('address') || lowerTopic.includes('where') || 
             lowerTopic.includes('direction') || lowerTopic.includes('find')) {
      questions = [
        'Where are you located?'
      ];
    } 
    // Hours related topics
    else if (lowerTopic.includes('hour') || lowerTopic.includes('time') || lowerTopic.includes('open') || 
             lowerTopic.includes('close') || lowerTopic.includes('day')) {
      questions = [
        'Do you offer daycare?'
      ];
    } 
    // Room related topics
    else if (lowerTopic.includes('room') || lowerTopic.includes('accommodation') || lowerTopic.includes('stay') || 
             lowerTopic.includes('deluxe') || lowerTopic.includes('premium') || lowerTopic.includes('executive')) {
      questions = [
        'What are your room options for pets?',
        'What\'s included in Deluxe rooms?',
        'What\'s included in Premium rooms?',
        'What\'s included in Executive rooms?',
        'Is there an extra fee for overnight stays?'
      ];
    }
    // Grooming related topics
    else if (lowerTopic.includes('groom') || lowerTopic.includes('bath') || lowerTopic.includes('haircut') || 
             lowerTopic.includes('nail') || lowerTopic.includes('clean')) {
      questions = [
        'What grooming services do you offer?',
        'How much do your services cost?'
      ];
    }
    // Contact related topics
    else if (lowerTopic.includes('contact') || lowerTopic.includes('phone') || lowerTopic.includes('email') || 
             lowerTopic.includes('call') || lowerTopic.includes('reach')) {
      questions = [
        'Where are you located?',
        'How can I review your services?'
      ];
    }
    // Pet types related topics
    else if (lowerTopic.includes('cat') || lowerTopic.includes('dog') || lowerTopic.includes('pet type') || 
             lowerTopic.includes('breed') || lowerTopic.includes('animal')) {
      questions = [
        'What pets do you accept?',
        'Who are your pet sitters?',
        'Do you support animal welfare?'
      ];
    }
    
    return questions;
  };
  
  // Add relevant follow-up options after bot responses
  const addFollowUpOptions = () => {
    // First remove any existing follow-up options
    setMessages(prev => prev.filter(msg => msg.type !== 'follow-up-options'));
    
    // Generate relevant questions based on the current topic
    const relevantQuestions = generateRelevantQuestions(currentTopic);
    
    const followUpMessage = {
      id: Date.now() + 2,
      type: 'follow-up-options',
      content: 'Would you like to know more about:',
      options: relevantQuestions,
      timestamp: new Date(),
      showBrowseMore: true // Option to browse more FAQs
    };
    
    setMessages(prev => [...prev, followUpMessage]);
    setShowingFollowUp(true);
    setFollowUpStage('options');
  };

  // Define topic categories and their related keywords for better scope handling
  const topicCategories = {
    about: {
      keywords: ['about', 'introduction', 'story', 'history', 'team', 'mich', 'marsha', 'who', 'founded', 'start', 'began', 'inception', 'est', '2019', 'established'],
      subtopics: ['history', 'team', 'mission', 'values']
    },
    location: {
      keywords: ['address', 'location', 'where', 'kenon', 'road', 'camp', 'baguio', 'city', 'philippines', '2600', 'service', 'area'],
      subtopics: ['address', 'service area', 'directions']
    },
    hours: {
      keywords: ['hours', 'open', 'time', 'schedule', 'availability', '24/7', 'always'],
      subtopics: ['operating hours', 'availability']
    },
    services: {
      keywords: ['service', 'offer', 'boarding', 'grooming', 'daycare', 'walk', 'sitting', 'categories', 'pet sitter'],
      subtopics: ['boarding', 'grooming', 'daycare', 'walking']
    },
    rooms: {
      keywords: ['room', 'deluxe', 'premium', 'executive', 'features', 'accommodation', 'stay', 'night', 'air purifier', 'ventilated'],
      subtopics: ['deluxe', 'premium', 'executive']
    },
    pricing: {
      keywords: ['price', 'cost', 'fee', 'rate', 'payment', 'discount', 'promotion', 'special', 'occasion', 'birthday', 'seasonal'],
      subtopics: ['room rates', 'grooming rates', 'daycare rates', 'discounts']
    },
    pets: {
      keywords: ['pet', 'dog', 'cat', 'rabbit', 'hamster', 'bird', 'turtle', 'snake', 'chicken', 'type', 'accept', 'welcome'],
      subtopics: ['accepted pets', 'requirements']
    },
    grooming: {
      keywords: ['groom', 'bath', 'dry', 'haircut', 'nail', 'trim', 'clean', 'premium', 'basic', 'special', 'package', 'st.roche'],
      subtopics: ['premium grooming', 'basic bath', 'special package']
    },
    booking: {
      keywords: ['book', 'reservation', 'appointment', 'schedule', 'process', 'confirm'],
      subtopics: ['booking process', 'requirements']
    },
    payment: {
      keywords: ['pay', 'payment', 'face', 'cash', 'process', 'method', 'transaction'],
      subtopics: ['payment methods', 'payment process']
    },
    requirements: {
      keywords: ['require', 'need', 'vaccination', 'id', 'pet id', 'illness', 'allergy', 'inform', 'health'],
      subtopics: ['pet id', 'health information', 'vaccination']
    },
    contact: {
      keywords: ['contact', 'facebook', 'instagram', 'call', 'number', 'phone', '0960', '260', '5983', 'social', 'media', 'message'],
      subtopics: ['phone', 'social media', 'messaging']
    },
    reviews: {
      keywords: ['review', 'rating', 'feedback', 'testimonial', 'experience', 'comment'],
      subtopics: ['customer reviews', 'ratings']
    }
  };

  // Function to check if a message is a help or contact request
  const isHelpOrContactRequest = (message) => {
    if (!message) return false;
    
    const messageLower = message.toLowerCase().trim();
    
    // Common help/contact request phrases
    const helpPhrases = [
      'help', 
      'talk to', 'speak to', 'chat with',
      'manager', 'staff', 'human', 'person', 'someone', 'agent',
      'phone number', 'contact number', 'your number', 'call you',
      'message you', 'text you', 'contact you', 'reach you',
      'need assistance', 'need help', 'want help',
      'emergency', 'urgent', 'talk to the pet store',
      'facebook', 'messenger', 'direct contact',
      'call someone', 'speak with someone'
    ];
    
    // Check for common help request patterns
    if (messageLower === 'help') return true;
    
    // Check for phrases like "I need help", "Can I talk to the manager", etc.
    const helpPatterns = [
      /\b(i|we)\s+(need|want)\s+(to\s+)?(help|assistance)/i,
      /\b(can|could|may)\s+(i|we)\s+(talk|speak|chat)\s+(to|with)/i,
      /\b(i|we)\s+(want|need)\s+(to\s+)?(talk|speak|chat)\s+(to|with)/i,
      /\b(how|where)\s+(can|could|do)\s+(i|we)\s+(contact|reach|find)/i,
      /\b(what|where)\s+is\s+(your|the)\s+(number|contact|phone)/i,
      /\b(give|share)\s+(me|us)\s+(your|the)\s+(number|contact)/i
    ];
    
    for (const pattern of helpPatterns) {
      if (pattern.test(messageLower)) return true;
    }
    
    // Count how many help-related keywords are in the message
    let helpKeywordCount = 0;
    for (const phrase of helpPhrases) {
      if (messageLower.includes(phrase)) {
        helpKeywordCount++;
      }
    }
    
    // If there are at least 2 help-related keywords, consider it a help request
    return helpKeywordCount >= 2;
  };

  // Function to determine which category a message belongs to
  const determineMessageCategory = (message) => {
    const messageLower = message.toLowerCase();
    let bestMatch = { category: null, score: 0 };
    
    // Check each category for keyword matches
    for (const [category, data] of Object.entries(topicCategories)) {
      const keywords = data.keywords;
      let matchCount = 0;
      
      for (const keyword of keywords) {
        if (messageLower.includes(keyword)) {
          matchCount++;
        }
      }
      
      // Calculate match score as percentage of matching keywords
      const score = keywords.length > 0 ? matchCount / keywords.length : 0;
      
      // Update best match if this category has a higher score
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }
    
    // Return the best matching category if score is above threshold
    return bestMatch.score >= 0.15 ? bestMatch.category : null;
  };
  
  // Function to generate contact information message
  const generateContactInfoMessage = () => {
    return `Our reception is open from 8:00 am to 6:00 pm. For emergencies outside these hours, please call +63 945 276 3087 or contact us via Facebook Messenger at http://m.me/BaguioPetBoardingPh/. Overnight staff provide basic care. Additional services outside regular hours incur an extra ₱80 per hour.`;
  };

  // Function to check if a message is related to a topic
  const isMessageRelatedToTopic = (message, topic) => {
    // Convert both to lowercase for case-insensitive comparison
    const messageLower = message.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    // Common follow-up phrases that should always be considered on-topic
    const commonFollowUps = [
      'tell me more',
      'more info',
      'what else',
      'continue',
      'go on',
      'explain',
      'elaborate',
      'details',
      'what do you mean',
      'how so',
      'why',
      'how',
      'ok',
      'i see',
      'got it',
      'understand',
      'thanks',
      'thank you',
      'please',
      'could you',
      'can you',
      'tell me about',
      'what about',
      'and',
      'also',
      'what is',
      'where is',
      'when is'
    ];
    
    // Check for common follow-up phrases
    for (const phrase of commonFollowUps) {
      if (messageLower.includes(phrase)) {
        return true;
      }
    }
    
    // If message is very short (5 words or less), consider it a follow-up
    const wordCount = messageLower.split(' ').length;
    if (wordCount <= 5) {
      return true;
    }
    
    // Determine the category of the original topic
    const topicCategory = determineMessageCategory(topic);
    
    // Determine the category of the user's message
    const messageCategory = determineMessageCategory(message);
    
    // If both have categories and they match, consider it related
    if (topicCategory && messageCategory && topicCategory === messageCategory) {
      return true;
    }
    
    // Extract key terms from the topic
    const topicKeywords = topicLower
      .replace(/[?.,!]/g, '') // Remove punctuation
      .split(' ')
      .filter(word => word.length > 3); // Only keep words longer than 3 chars to avoid common words
    
    // Check if the message contains enough topic keywords
    const matchingKeywords = topicKeywords.filter(keyword => messageLower.includes(keyword));
    
    // Consider it related if at least 30% of keywords match (lowered threshold)
    return matchingKeywords.length >= Math.max(1, Math.floor(topicKeywords.length * 0.3));
  };
  
  // Function to check if input is meaningful enough to process
  const isValidInput = (input) => {
    if (!input || typeof input !== 'string') return false;
    
    const trimmed = input.trim();
    
    // Check minimum length (at least 2 characters)
    if (trimmed.length < 2) return false;
    
    // Check if it's just a single letter or number
    if (/^[a-zA-Z0-9]$/.test(trimmed)) return false;
    
    // Check if it's just punctuation or special characters
    if (/^[^a-zA-Z0-9]+$/.test(trimmed)) return false;
    
    // Check if it's just repeating characters (like 'aaa' or '...')
    if (/^(.)(\1+)$/.test(trimmed)) return false;
    
    return true;
  };
  
  // Handle sending a message from the input field
  const handleSendMessage = async (message) => {
    if (isLoading || !message.trim()) return;
    
    // Validate input before processing
    if (!isValidInput(message)) {
      console.log('Invalid input detected:', message);
      return;
    }
    
    // Hide the follow-up question if it's showing
    setShowingFollowUp(false);
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    // Check if this is a help or contact request
    if (isHelpOrContactRequest(message)) {
      // This is a help or contact request, provide contact information
      setIsLoading(false);
      
      const contactInfoMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateContactInfoMessage(),
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, contactInfoMessage]);
      
      // Don't add a follow-up question after contact info
      return;
    }
    
    // Check if we're in a specific topic context and if the message is related to that topic
    if (showInputField && currentTopic && !isMessageRelatedToTopic(message, currentTopic)) {
      // Message is not related to the current topic
      setIsLoading(false);
      
      // Determine the category of the user's message
      const messageCategory = determineMessageCategory(message);
      
      // Determine the category of the current topic
      const topicCategory = determineMessageCategory(currentTopic);
      
      // Create a more specific out-of-scope response based on detected categories
      let outOfScopeContent = `I notice you're asking about something different from "${currentTopic}".`;
      
      // If we can detect what they're asking about, be more specific
      if (messageCategory) {
        const categoryNames = {
          about: 'our background and team',
          location: 'our location and address',
          hours: 'our operating hours',
          services: 'our services',
          rooms: 'our room accommodations',
          pricing: 'our pricing and rates',
          pets: 'the types of pets we accept',
          grooming: 'our grooming services',
          booking: 'the booking process',
          payment: 'payment methods',
          requirements: 'pet requirements',
          contact: 'contact information',
          reviews: 'customer reviews'
        };
        
        outOfScopeContent += ` It looks like you're asking about ${categoryNames[messageCategory]}.`;
      }
      
      outOfScopeContent += ` I'd be happy to help with that! To get the best answer, could you please go back to our FAQ list and select a question related to what you'd like to know? That way I can give you the most accurate information.`;
      
      const outOfScopeMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: outOfScopeContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, outOfScopeMessage]);
      
      // Add follow-up to browse more FAQs
      setTimeout(() => {
        const browseMoreMessage = {
          id: Date.now() + 2,
          type: 'follow-up',
          content: 'Would you like to browse more FAQs?',
          timestamp: new Date(),
          stage: 'another'
        };
        setMessages(prev => [...prev, browseMoreMessage]);
        setShowingFollowUp(true);
        setFollowUpStage('another');
      }, 800);
      
      return;
    }
    
    try {
      console.log('Sending message to API:', message);
      const response = await fetch(`${API_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message, sessionId }),
      });

      const data = await response.json();
      console.log('Response from API:', data);

      if (response.ok) {
        // The API can return data.answer or data.message depending on which backend service responds
        const botContent = data.answer || data.message || data.response || "I don't have an answer for that right now.";
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: botContent,
          timestamp: new Date(),
          relevantInfo: data.relevantInfo,
        };
        console.log('Adding bot message to chat:', botMessage);
        setMessages((prev) => [...prev, botMessage]);
        
        // Add follow-up options after a short delay
        setTimeout(() => {
          addFollowUpOptions();
        }, 800);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error in chatbot communication:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          content:
            "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user selecting a question from FAQ
  const handleQuestionSelect = (question) => {
    if (isLoading) return;
    
    // Reset follow-up state
    setShowingFollowUp(false);
    
    // Update navigation state
    setPreviousView(viewState);
    setViewState('chat');
    
    // Process the selected question using our centralized message handler
    processUserMessage(question);
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    
  // Function to make links and phone numbers clickable in messages
  const makeLinksClickable = (text) => {
    if (!text) return '';
    
    // Create a temporary div to work with the text
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    let processedText = tempDiv.textContent;
    
    // Process in specific order to avoid nested replacements
    
    // Step 1: Convert phone numbers to clickable links first
    // Match formats like: +63 945 276 3087, 0960 260 5983, etc.
    const phoneRegex = /([+]?\d{1,3}[\s-]?)?\d{3,4}[\s-]?\d{3}[\s-]?\d{4}/g;
    processedText = processedText.replace(phoneRegex, (phone) => {
      // Remove spaces for the actual link
      const cleanPhone = phone.replace(/\s/g, '');
      return `<a href="tel:${cleanPhone}" class="phone-link">${phone}</a>`;
    });
    
    // Step 2: Handle Facebook Messenger links specifically
    // Look for patterns like http://m.me/BaguioPetBoardingPh
    processedText = processedText.replace(
      /(https?:\/\/m\.me\/[\w.\-/]+)/gi,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="messenger-link">Facebook Messenger</a>`
    );
    
    // Step 3: Convert remaining URLs to clickable links
    // This regex is more precise to avoid matching already processed links
    const urlRegex = /(?<!href=")(https?:\/\/[^\s"'<>]+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      // Create a friendly display name for the link if it's too long
      const displayUrl = url.length > 30 ? url.substring(0, 27) + '...' : url;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="web-link">${displayUrl}</a>`;
    });
    
    return processedText;
  };
  
  // Process a user message and get a response with follow-up options
  const processUserMessage = async (question) => {
    // Create and add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Store the current topic for follow-up questions
    setCurrentTopic(question);
    
    try {
      // Send the question to the API
      const response = await fetch(`${API_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: question, sessionId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const botContent = data.answer || data.message || data.response || "I don't have an answer for that right now.";
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: botContent,
          timestamp: new Date(),
          relevantInfo: data.relevantInfo,
        };
        
        // Remove any existing follow-up options
        setMessages(prev => prev.filter(msg => msg.type !== 'follow-up-options').concat([botMessage]));
        
        // Reset showingFollowUp flag to ensure new follow-up options can be added
        setShowingFollowUp(false);
        
        // Add follow-up options after a short delay
        setTimeout(() => {
          addFollowUpOptions();
        }, 800);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error in chatbot communication:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle follow-up option clicks
  const handleFollowUpOptionClick = (question) => {
    // Remove the follow-up options
    setMessages(prev => prev.filter(msg => msg.type !== 'follow-up-options'));
    setShowingFollowUp(false);
    
    // If user clicked "Browse more FAQs"
    if (question === 'browse_more_faqs') {
      // Reset back to FAQ view
      setMessages([messages[0]]);
      setPreviousView('chat');
      setViewState('initial');
      return;
    }
    
    // Otherwise, process the clicked option as a new question
    processUserMessage(question);
  };
  
  // Legacy handler for yes/no follow-up responses (no longer used but kept for reference)
  const handleFollowUpResponse = (wantsMore) => {
    // Remove the follow-up question
    setMessages(prev => prev.filter(msg => msg.type !== 'follow-up'));
    setShowingFollowUp(false);
    
    // If user wants to browse more FAQs
    if (wantsMore === 'browse_more_faqs') {
      // Reset back to FAQ view
      setMessages([messages[0]]);
      setPreviousView('chat');
      setViewState('initial');
    } else if (wantsMore) {
      // Add follow-up options
      addFollowUpOptions();
    } else {
      // Add final thank you message
      const finalMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Thank you for chatting with us! Feel free to browse our FAQs anytime you need assistance.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, finalMessage]);
      // Show follow-up to browse more FAQs
      setTimeout(() => {
        addFollowUpOptions();
      }, 800);
    }
  };
  
  // This comment replaces the duplicate scrollToBottom function that was here

  return (
    isOpen && (
      <div className="chatbot-overlay">
        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="header-content">
              {viewState !== 'initial' && (
                <button
                  onClick={handleBack}
                  className="back-button"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <Bot size={20} className="header-icon" />
              <span className="header-title">Pet Care Assistant</span>
            </div>
            <button
              onClick={onClose}
              className="close-button"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages - only show when not in initial/FAQ view */}
          {viewState !== 'initial' && (
            <div className="messages-area" ref={chatContainerRef}>
              {messages.map((msg) => {
              if (msg.type === 'follow-up-options') {
                // Render follow-up options as clickable buttons
                return (
                  <div key={msg.id} className="message-wrapper bot-message">
                    <div className="message-bubble bot">
                      <div className="message-content">{msg.content}</div>
                      <div className="follow-up-options">
                        {msg.options.map((option, index) => (
                          <button
                            key={index}
                            className="option-button"
                            onClick={() => handleFollowUpOptionClick(option)}
                          >
                            {option}
                          </button>
                        ))}
                        {msg.showBrowseMore && (
                          <>
                            <button
                              className="option-button browse-more-button"
                              onClick={() => handleFollowUpOptionClick('browse_more_faqs')}
                            >
                              Browse more FAQs
                            </button>
                            <button
                              className="option-button chat-frame-button"
                              onClick={() => window.parent.postMessage({ type: 'RETURN_TO_CHAT_FRAME' }, '*')}
                            >
                              Take me back to chat frame
                            </button>
                          </>
                        )}
                      </div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              }
              
              // Legacy follow-up question rendering (no longer used but kept for backward compatibility)
              if (msg.type === 'follow-up') {
                return (
                  <div key={msg.id} className="follow-up-container">
                    <div className="follow-up-question">{msg.content}</div>
                    <div className="follow-up-buttons">
                      <button 
                        className="follow-up-button yes" 
                        onClick={() => handleFollowUpResponse(true)}
                      >
                        <ThumbsUp size={16} />
                        <span>Yes</span>
                      </button>
                      <button 
                        className="follow-up-button no" 
                        onClick={() => handleFollowUpResponse(false)}
                      >
                        <ThumbsDown size={16} />
                        <span>No, thanks</span>
                      </button>
                    </div>
                  </div>
                );
              }
              
              // Regular message rendering
              return (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className={`message-bubble ${msg.type} ${msg.isError ? 'error' : ''}`}>
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: makeLinksClickable(msg.content) }}
                    />
                    <div className="message-time">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="message-wrapper bot-message">
                <div className="message-bubble bot">
                  <div className="message-content">
                    Processing your request...
                  </div>
                </div>
              </div>
            )}

              <div ref={messagesEndRef} />
            </div>
          )}
          
          {/* Scroll to bottom button - only shows when scrolled up and not in FAQ view */}
          {isScrolledUp && viewState !== 'initial' && (
            <button 
              className="scroll-bottom-button" 
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <ArrowDown size={20} />
            </button>
          )}

          {/* Enhanced FAQ - show based on view state */}
          {viewState === 'initial' && !isLoading && (
            <div className="enhanced-faq-wrapper">
              <ChatbotFAQ onQuestionClick={handleQuestionSelect} />
            </div>
          )}
          
          {/* No message input field - using click-based interface only */}

        </div>
      </div>
    )
  );
};

export default ChatbotNew;