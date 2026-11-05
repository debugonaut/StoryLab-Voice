/**
 * StoryLab Voice — AI Voice Tutor (Chatbot Core)
 * Owner: Ritesh Gavhane (Part 2)
 *
 * Exports: window.Chatbot
 *   .speak(text)  → Promise<void>    — TTS narration (always resolves)
 *   .listen()     → Promise<string>  — STT transcription ('' on error/timeout)
 *   .mount(root)  → void             — render the tutor screen
 *   .unmount()    → void             — cancel speech, stop recognition, reset
 *   .state        → 'idle'|'listening'|'thinking'|'speaking'
 *
 * Demo pass: 22 categorised topics with icons, category tabs, plain-language
 * labels, and a bounded conversation log.
 */
;(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
   * State
   * ───────────────────────────────────────────────────────── */
  var _state = 'idle';
  var _activeRec = null;
  var _utterance = null;
  var _unmounted = false;
  var _fallbackOpen = false;
  var _listening = false;
  var _queryToken = 0;
  var _queryTimer = null;
  var _root = null;
  var _category = 'all';
  var _micStream = null;
  var _micCtx = null;
  var _micRAF = null;
  var _history = [];
  var _lessonContext = null;

  var MAX_LINES = 12;

  var LANGS = [
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिंदी' },
    { id: 'mr', label: 'मराठी' }
  ];

  var CAT_LABELS = {
    en: { all: 'All', math: 'Math', science: 'Science', world: 'World', everyday: 'Everyday' },
    hi: { all: 'सभी', math: 'गणित', science: 'विज्ञान', world: 'दुनिया', everyday: 'रोज़मर्रा' },
    mr: { all: 'सर्व', math: 'गणित', science: 'विज्ञान', world: 'जग', everyday: 'रोजचे' }
  };

  var STRINGS = {
    en: {
      panel: 'VOICE TUTOR', ready: 'Ready', listening: 'Listening…', thinking: 'Thinking…',
      speaking: 'Speaking…', speak: 'SPEAK NOW', stop: 'STOP', heard: 'HEARD',
      intro: 'Ask about math, science, the world, or everyday life. Tap a question or press SPEAK NOW.',
      listeningLine: 'Listening — speak now.',
      heardNone: 'Nothing heard. Press SPEAK NOW and try again.',
      denied: 'Microphone is blocked. Allow it for this site, or tap a question above.',
      unsupported: 'This browser cannot listen. Type your question below, or tap one above.',
      network: 'Listening needs a connection. Tap a question above instead.',
      notSure: 'I am not sure about that yet. Ask me about math, science, the world, or everyday life.',
      aiOnline: 'AI ON', aiOffline: 'OFFLINE', type: 'TYPE',
      switched: 'Answering in English now.'
    },
    hi: {
      panel: 'वॉइस ट्यूटर', ready: 'तैयार', listening: 'सुन रहा हूँ…', thinking: 'सोच रहा हूँ…',
      speaking: 'बोल रहा हूँ…', speak: 'बोलिए', stop: 'रोकें', heard: 'सुना',
      intro: 'गणित, विज्ञान, दुनिया या रोज़मर्रा की ज़िंदगी के बारे में पूछो। सवाल चुनो या बोलिए दबाओ।',
      listeningLine: 'सुन रहा हूँ — अब बोलो।',
      heardNone: 'कुछ सुनाई नहीं दिया। बोलिए दबाकर फिर कोशिश करो।',
      denied: 'माइक्रोफ़ोन बंद है। ब्राउज़र में इसे चालू करो, या ऊपर से सवाल चुनो।',
      unsupported: 'यह ब्राउज़र सुन नहीं सकता। नीचे सवाल लिखो, या ऊपर से चुनो।',
      network: 'सुनने के लिए इंटरनेट चाहिए। ऊपर से सवाल चुनो।',
      notSure: 'इस बारे में मुझे अभी पक्का नहीं पता। गणित, विज्ञान, दुनिया या रोज़मर्रा की बातें पूछो।',
      aiOnline: 'एआई चालू', aiOffline: 'ऑफ़लाइन', type: 'लिखो',
      switched: 'अब मैं हिंदी में जवाब दूँगा।'
    },
    mr: {
      panel: 'व्हॉइस ट्यूटर', ready: 'तयार', listening: 'ऐकत आहे…', thinking: 'विचार करत आहे…',
      speaking: 'बोलत आहे…', speak: 'बोला', stop: 'थांबा', heard: 'ऐकले',
      intro: 'गणित, विज्ञान, जग किंवा रोजच्या आयुष्याबद्दल विचारा. प्रश्न निवडा किंवा बोला दाबा.',
      listeningLine: 'ऐकत आहे — आता बोला.',
      heardNone: 'काहीच ऐकू आले नाही. बोला दाबून पुन्हा प्रयत्न करा.',
      denied: 'मायक्रोफोन बंद आहे. ब्राउझरमध्ये सुरू करा, किंवा वरून प्रश्न निवडा.',
      unsupported: 'हा ब्राउझर ऐकू शकत नाही. खाली प्रश्न लिहा, किंवा वरून निवडा.',
      network: 'ऐकण्यासाठी इंटरनेट लागते. वरून प्रश्न निवडा.',
      notSure: 'याबद्दल मला अजून नक्की माहीत नाही. गणित, विज्ञान, जग किंवा रोजच्या गोष्टी विचारा.',
      aiOnline: 'एआय सुरू', aiOffline: 'ऑफलाइन', type: 'लिहा',
      switched: 'आता मी मराठीत उत्तर देईन.'
    }
  };

  var I18N = {
    hi: {
      greeting: { q: 'नमस्ते', a: 'नमस्ते! मैं तुम्हारा स्टोरीलैब ट्यूटर हूँ। गणित, विज्ञान, दुनिया या रोज़मर्रा की ज़िंदगी के बारे में पूछो।', k: ['नमस्ते', 'हैलो', 'नमस्कार'] },
      division: { q: 'भाग कैसे करें?', a: 'भाग करने का मतलब है किसी संख्या को बराबर हिस्सों में बाँटना। 50 को 8 से बाँटने पर 6 हिस्से बनते हैं और 2 बचते हैं, इसे 6 शेष 2 कहते हैं।', k: ['भाग', 'बाँटना', 'शेष'] },
      fractions: { q: 'भिन्न क्या है?', a: 'भिन्न पूरे का एक हिस्सा है। ऊपर की संख्या बताती है कि तुम्हारे पास कितने हिस्से हैं, नीचे की संख्या बताती है कि कुल कितने बराबर हिस्से हैं।', k: ['भिन्न', 'अंश', 'हर'] },
      multiplication: { q: 'गुणा कैसे होता है?', a: 'गुणा बार-बार जोड़ना है। 6 गुणा 8 का मतलब 6 को आठ बार जोड़ना, जो 48 होता है।', k: ['गुणा', 'पहाड़ा'] },
      addition: { q: 'जोड़ सिखाओ', a: 'जोड़ दो संख्याओं को मिलाकर कुल बनाता है। 35 और 27 मिलकर 62 होते हैं। इकाई को इकाई के नीचे और दहाई को दहाई के नीचे लिखो।', k: ['जोड़', 'जोड़ना', 'योग'] },
      subtraction: { q: 'घटाना कैसे करें?', a: 'घटाना दो संख्याओं का अंतर निकालता है। 50 में से 18 घटाने पर 32 बचते हैं। जाँच के लिए 32 में 18 जोड़ो, 50 मिलेंगे।', k: ['घटाना', 'घटाव', 'अंतर'] },
      shapes: { q: 'कुछ आकार बताओ', a: 'वर्ग के चार बराबर किनारे और चार कोने होते हैं। त्रिभुज के तीन किनारे होते हैं। वृत्त गोल होता है, उसका कोई कोना नहीं होता।', k: ['आकार', 'वर्ग', 'त्रिभुज', 'वृत्त'] },
      photosynthesis: { q: 'प्रकाश संश्लेषण क्या है?', a: 'पौधे सूरज की रोशनी, पानी और हवा से अपना खाना बनाते हैं। पत्तियों का हरा रंग रोशनी पकड़ता है और ऑक्सीजन बाहर आती है।', k: ['प्रकाश संश्लेषण', 'पत्ती', 'हरा'] },
      'water-cycle': { q: 'जल चक्र क्या है?', a: 'सूरज पानी को गरम करता है, वह भाप बनकर ऊपर जाता है। ऊपर ठंडा होकर बादल बनते हैं और फिर बारिश होती है।', k: ['जल चक्र', 'बारिश', 'बादल', 'भाप'] },
      'solar-system': { q: 'सौरमंडल के बारे में बताओ', a: 'सूरज के चारों ओर आठ ग्रह घूमते हैं: बुध, शुक्र, पृथ्वी, मंगल, बृहस्पति, शनि, अरुण और वरुण। पृथ्वी तीसरे स्थान पर है।', k: ['सौरमंडल', 'ग्रह', 'सूरज'] },
      gravity: { q: 'गुरुत्वाकर्षण क्या है?', a: 'गुरुत्वाकर्षण वह बल है जो चीज़ों को एक-दूसरे की ओर खींचता है। पृथ्वी सबको अपने केंद्र की ओर खींचती है, इसलिए गेंद नीचे गिरती है।', k: ['गुरुत्वाकर्षण', 'गुरुत्व', 'नीचे गिरना'] },
      matter: { q: 'ठोस, द्रव और गैस क्या हैं?', a: 'ठोस अपना आकार बनाए रखते हैं, जैसे बर्फ। द्रव बहते हैं और बर्तन का आकार ले लेते हैं, जैसे पानी। गैस हर जगह फैल जाती है, जैसे हवा।', k: ['ठोस', 'द्रव', 'गैस', 'पदार्थ'] },
      thunder: { q: 'बिजली पहले क्यों दिखती है?', a: 'रोशनी आवाज़ से बहुत तेज़ चलती है। इसलिए बिजली की चमक तुरंत दिखती है और गरज बाद में सुनाई देती है।', k: ['बिजली', 'गरज', 'तूफान'] },
      maps: { q: 'नक्शा कैसे पढ़ें?', a: 'नक्शा किसी जगह को ऊपर से दिखाता है। दिशा के लिए उत्तर, दूरी के लिए पैमाना और जगहों के लिए चिन्ह होते हैं। ऊपर आमतौर पर उत्तर होता है।', k: ['नक्शा', 'दिशा', 'उत्तर', 'पैमाना'] },
      seasons: { q: 'मौसम क्यों बदलता है?', a: 'पृथ्वी सूरज के चारों ओर घूमते समय थोड़ी झुकी रहती है। जब तुम्हारा हिस्सा सूरज की ओर झुकता है तब गर्मी होती है, और दूर झुकने पर सर्दी।', k: ['मौसम', 'गर्मी', 'सर्दी', 'ऋतु'] },
      oceans: { q: 'कितने महासागर हैं?', a: 'पाँच महासागर हैं: प्रशांत, अटलांटिक, हिंद, दक्षिणी और आर्कटिक। प्रशांत सबसे बड़ा है और आर्कटिक सबसे छोटा।', k: ['महासागर', 'समुद्र', 'प्रशांत'] },
      panchayat: { q: 'गाँव की पंचायत क्या है?', a: 'पंचायत चुने हुए लोगों का समूह है जो गाँव के पानी, सड़क और स्कूल जैसे काम देखता है। गाँव वाले मिलकर चर्चा करते हैं और फिर फैसला लेते हैं।', k: ['पंचायत', 'सरपंच', 'गाँव'] },
      'healthy-food': { q: 'सेहत के लिए क्या खाएँ?', a: 'थाली में अनाज, दाल, सब्ज़ियाँ और फल लो, और दिनभर पानी पीते रहो। हर दिन अलग रंग की सब्ज़ी खाओ और मिठाई कभी-कभी।', k: ['स्वस्थ भोजन', 'सेहत', 'सब्ज़ी', 'फल'] },
      'water-saving': { q: 'पानी कैसे बचाएँ?', a: 'ब्रश करते समय नल बंद रखो, टपकते नल ठीक करो और बारिश का पानी पौधों के लिए इकट्ठा करो। छोटी आदतें साल भर में बहुत पानी बचाती हैं।', k: ['पानी बचाना', 'नल', 'बारिश का पानी'] },
      sleep: { q: 'कितनी नींद चाहिए?', a: 'बच्चों को हर रात 9 से 11 घंटे नींद चाहिए। नींद याद रखने, मूड ठीक रखने और बढ़ने में मदद करती है।', k: ['नींद', 'सोना', 'आराम'] },
      exercise: { q: 'बाहर खेलना क्यों ज़रूरी है?', a: 'बाहर खेलने से हड्डियाँ और मांसपेशियाँ मज़बूत बनती हैं और आँखों को स्क्रीन से आराम मिलता है। रोज़ एक घंटा खेलना काफी है।', k: ['खेलना', 'व्यायाम', 'बाहर'] },
      reading: { q: 'रोज़ पढ़ना क्यों अच्छा है?', a: 'पढ़ने से शब्द बढ़ते हैं और दूसरे विषय समझने में मदद मिलती है। किसी भी भाषा में रोज़ दस मिनट पढ़ो।', k: ['पढ़ना', 'किताब', 'कहानी'] }
    },
    mr: {
      greeting: { q: 'नमस्कार', a: 'नमस्कार! मी तुमचा स्टोरीलॅब शिक्षक आहे. गणित, विज्ञान, जग किंवा रोजच्या आयुष्याबद्दल विचारा.', k: ['नमस्कार', 'हॅलो'] },
      division: { q: 'भागाकार कसा करतात?', a: 'भागाकार म्हणजे संख्या समान भागांत वाटणे. 50 ला 8 ने भागले तर 6 भाग होतात आणि 2 उरतात, म्हणजे 6 बाकी 2.', k: ['भागाकार', 'वाटणे', 'बाकी'] },
      fractions: { q: 'अपूर्णांक काय आहे?', a: 'अपूर्णांक म्हणजे पूर्णाचा भाग. वरची संख्या तुमच्याकडे किती भाग आहेत ते सांगते, खालची संख्या एकूण किती समान भाग आहेत ते सांगते.', k: ['अपूर्णांक', 'अंश', 'छेद'] },
      multiplication: { q: 'गुणाकार कसा होतो?', a: 'गुणाकार म्हणजे वारंवार बेरीज. 6 गुणिले 8 म्हणजे 6 आठ वेळा बेरीज, जे 48 होते.', k: ['गुणाकार', 'पाढा'] },
      addition: { q: 'बेरीज शिकवा', a: 'बेरीज दोन संख्या मिळून एकूण बनवते. 35 आणि 27 मिळून 62 होतात. एकक एककाखाली आणि दशक दशकाखाली लिहा.', k: ['बेरीज', 'जोडणे'] },
      subtraction: { q: 'वजाबाकी कशी करतात?', a: 'वजाबाकी दोन संख्यांमधील फरक काढते. 50 मधून 18 वजा केल्यास 32 उरतात. तपासणीसाठी 32 मध्ये 18 मिळवा, 50 मिळतील.', k: ['वजाबाकी', 'वजा', 'फरक'] },
      shapes: { q: 'काही आकार सांगा', a: 'चौरसाला चार समान बाजू आणि चार कोपरे असतात. त्रिकोणाला तीन बाजू असतात. वर्तुळ गोल असते, त्याला कोपरा नसतो.', k: ['आकार', 'चौरस', 'त्रिकोण', 'वर्तुळ'] },
      photosynthesis: { q: 'प्रकाशसंश्लेषण काय आहे?', a: 'वनस्पती सूर्यप्रकाश, पाणी आणि हवा यांपासून स्वतःचे अन्न तयार करतात. पानांचा हिरवा रंग प्रकाश पकडतो आणि ऑक्सिजन बाहेर सोडतो.', k: ['प्रकाशसंश्लेषण', 'पान', 'हिरवा'] },
      'water-cycle': { q: 'जलचक्र काय आहे?', a: 'सूर्य पाणी गरम करतो, ते वाफ होऊन वर जाते. वर थंड होऊन ढग तयार होतात आणि पाऊस पडतो.', k: ['जलचक्र', 'पाऊस', 'ढग', 'वाफ'] },
      'solar-system': { q: 'सूर्यमालेविषयी सांगा', a: 'सूर्याभोवती आठ ग्रह फिरतात: बुध, शुक्र, पृथ्वी, मंगळ, गुरु, शनी, युरेनस आणि नेपच्यून. पृथ्वी तिसऱ्या क्रमांकावर आहे.', k: ['सूर्यमाला', 'ग्रह', 'सूर्य'] },
      gravity: { q: 'गुरुत्वाकर्षण काय आहे?', a: 'गुरुत्वाकर्षण हे असे बल आहे जे वस्तूंना एकमेकांकडे खेचते. पृथ्वी सर्वांना तिच्या केंद्राकडे खेचते, म्हणून चेंडू खाली पडतो.', k: ['गुरुत्वाकर्षण', 'गुरुत्व'] },
      matter: { q: 'घन, द्रव आणि वायू काय आहेत?', a: 'घन आपला आकार टिकवतात, जसे बर्फ. द्रव वाहतात आणि पात्राचा आकार घेतात, जसे पाणी. वायू सर्वत्र पसरतात, जसे हवा.', k: ['घन', 'द्रव', 'वायू', 'पदार्थ'] },
      thunder: { q: 'वीज आधी का दिसते?', a: 'प्रकाश आवाजापेक्षा खूप वेगाने जातो. म्हणून विजेची चमक लगेच दिसते आणि गडगडाट नंतर ऐकू येतो.', k: ['वीज', 'गडगडाट', 'वादळ'] },
      maps: { q: 'नकाशा कसा वाचायचा?', a: 'नकाशा एखादे ठिकाण वरून दाखवतो. दिशेसाठी उत्तर, अंतरासाठी मापन आणि ठिकाणांसाठी चिन्हे असतात. वर सहसा उत्तर असते.', k: ['नकाशा', 'दिशा', 'उत्तर'] },
      seasons: { q: 'ऋतू का बदलतात?', a: 'पृथ्वी सूर्याभोवती फिरताना थोडी कललेली असते. तुमचा भाग सूर्याकडे कलल्यावर उन्हाळा असतो, दूर कलल्यावर हिवाळा.', k: ['ऋतू', 'उन्हाळा', 'हिवाळा', 'हंगाम'] },
      oceans: { q: 'किती महासागर आहेत?', a: 'पाच महासागर आहेत: पॅसिफिक, अटलांटिक, हिंदी, दक्षिणी आणि आर्क्टिक. पॅसिफिक सर्वात मोठा आहे.', k: ['महासागर', 'समुद्र', 'पॅसिफिक'] },
      panchayat: { q: 'गावची पंचायत काय आहे?', a: 'पंचायत म्हणजे निवडलेल्या लोकांचा गट जो गावातील पाणी, रस्ते आणि शाळा यांची काळजी घेतो. गावकरी एकत्र चर्चा करून निर्णय घेतात.', k: ['पंचायत', 'सरपंच', 'गाव'] },
      'healthy-food': { q: 'आरोग्यासाठी काय खावे?', a: 'ताटात धान्य, डाळ, भाज्या आणि फळे घ्या, आणि दिवसभर पाणी प्या. दररोज वेगवेगळ्या रंगाच्या भाज्या खा, गोड पदार्थ क्वचित.', k: ['आरोग्यदायी अन्न', 'आरोग्य', 'भाजी', 'फळ'] },
      'water-saving': { q: 'पाणी कसे वाचवायचे?', a: 'ब्रश करताना नळ बंद ठेवा, गळणारे नळ दुरुस्त करा आणि पावसाचे पाणी झाडांसाठी साठवा. छोट्या सवयी वर्षभरात खूप पाणी वाचवतात.', k: ['पाणी वाचवा', 'नळ', 'पावसाचे पाणी'] },
      sleep: { q: 'किती झोप लागते?', a: 'मुलांना दररोज रात्री 9 ते 11 तास झोप आवश्यक आहे. झोप आठवणीत ठेवण्यास, मूड स्थिर ठेवण्यास आणि वाढीस मदत करते.', k: ['झोप', 'झोपणे', 'विश्रांती'] },
      exercise: { q: 'बाहेर खेळणे का आवश्यक?', a: 'बाहेर खेळल्याने हाडे आणि स्नायू मजबूत होतात आणि डोळ्यांना स्क्रीनपासून विश्रांती मिळते. दररोज एक तास खेळणे पुरेसे आहे.', k: ['खेळणे', 'व्यायाम', 'बाहेर'] },
      reading: { q: 'दररोज वाचणे का चांगले?', a: 'वाचल्याने शब्दसंग्रह वाढतो आणि इतर विषय समजायला मदत होते. कोणत्याही भाषेत दररोज दहा मिनिटे वाचा.', k: ['वाचन', 'पुस्तक', 'गोष्ट'] }
    }
  };

  function _lang() {
    try {
      var p = window.StoryLabState && window.StoryLabState.getProfile && window.StoryLabState.getProfile();
      var lang = p && p.language;
      return (lang === 'hi' || lang === 'mr') ? lang : 'en';
    } catch (e) { return 'en'; }
  }

  function _S() { return STRINGS[_lang()] || STRINGS.en; }

  function _tr(topic) {
    var pack = I18N[_lang()];
    return (pack && pack[topic.id]) || null;
  }

  function _question(topic) {
    var tr = _tr(topic);
    return (tr && tr.q) || topic.question;
  }

  function _answerFor(topic) {
    var tr = _tr(topic);
    return (tr && tr.a) || topic.answer;
  }

  function _keywordsFor(topic) {
    var tr = _tr(topic);
    return (tr && tr.k) ? topic.keywords.concat(tr.k) : topic.keywords;
  }

  function _catLabel(cat) {
    var map = CAT_LABELS[_lang()] || CAT_LABELS.en;
    return (map && map[cat.id]) || cat.label;
  }

  /* ─────────────────────────────────────────────────────────
   * Helpers
   * ───────────────────────────────────────────────────────── */
  function _getLanguageTag() {
    try {
      var profile = window.StoryLabState && window.StoryLabState.getProfile();
      var lang = profile && profile.language;
      var map = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
      return map[lang] || 'en-IN';
    } catch (e) {
      return 'en-IN';
    }
  }

  function _setState(s) {
    _state = s;
    var waveforms = document.querySelectorAll('[data-state]');
    for (var i = 0; i < waveforms.length; i++) {
      waveforms[i].setAttribute('data-state', s);
    }
  }

  function _esc(value) {
    return window.StoryLabUI
      ? window.StoryLabUI.escape(value)
      : String(value == null ? '' : value)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _hasWord(text, word) {
    var safe = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z])' + safe + '([^a-z]|$)', 'i').test(text);
  }

  /* ─────────────────────────────────────────────────────────
   * speak(text) — TTS
   * ───────────────────────────────────────────────────────── */
  function speak(text, lang) {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) {
        console.log('[Chatbot SPEAK]', text);
        _setState('idle');
        setTimeout(resolve, 250);
        return;
      }

      var settled = false;
      var safety = null;
      function settle() {
        if (settled) return;
        settled = true;
        if (safety) { clearTimeout(safety); safety = null; }
        if (_utterance === utter) {
          _utterance = null;
          _setState('idle');
        }
        resolve();
      }

      window.speechSynthesis.cancel();

      var utter = new SpeechSynthesisUtterance(text);
      utter.lang  = lang || _getLanguageTag();
      utter.rate  = 0.92;
      utter.pitch = 1.0;

      utter.onstart = function () { _setState('speaking'); };
      utter.onend   = function () { settle(); };
      utter.onerror = function (e) {
        if (e.error !== 'interrupted' && e.error !== 'canceled' && e.error !== 'cancelled') {
          console.warn('[Chatbot] TTS error:', e.error);
        }
        settle();
      };

      _setState('speaking');
      _utterance = utter;
      window.speechSynthesis.speak(utter);

      var safetyMs = Math.max(4000, text.length * 80 + 3000);
      safety = setTimeout(function () { settle(); }, safetyMs);
    });
  }

  /* ─────────────────────────────────────────────────────────
   * listen() — STT with inline text fallback
   * ───────────────────────────────────────────────────────── */
  function listenLive(onInterim, lang) {
    return new Promise(function (resolve) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SR) {
        _inlineTextFallback(function (text) {
          resolve({ text: text || '', confidence: 0, reason: text ? 'typed' : 'unsupported' });
        });
        return;
      }

      _setState('listening');

      var rec = new SR();
      rec.lang = lang || _getLanguageTag();
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;
      _activeRec = rec;

      var settled = false;
      var best = '';
      var confidence = 0;
      var silence = null;
      var hardStop = null;

      function settle(reason) {
        if (settled) return;
        settled = true;
        if (hardStop) clearTimeout(hardStop);
        if (silence) clearTimeout(silence);
        _activeRec = null;
        _setState('idle');
        resolve({
          text: best.trim(),
          confidence: confidence,
          reason: reason || (best.trim() ? 'ok' : 'no-speech')
        });
      }

      function armSilence(ms) {
        if (silence) clearTimeout(silence);
        silence = setTimeout(function () { try { rec.stop(); } catch (e) {} }, ms);
      }

      hardStop = setTimeout(function () { try { rec.stop(); } catch (e) {} }, 9000);

      rec.onresult = function (event) {
        var interim = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var result = event.results[i];
          var alt = result[0];
          if (result.isFinal) {
            best = (best + ' ' + (alt.transcript || '')).trim();
            confidence = Math.max(confidence, alt.confidence || 0);
          } else {
            interim += alt.transcript || '';
          }
        }
        var live = (best + ' ' + interim).trim();
        if (typeof onInterim === 'function' && live) onInterim(live, false);
        armSilence(interim ? 1300 : 700);
      };

      rec.onerror = function (e) {
        var map = {
          'not-allowed': 'denied',
          'service-not-allowed': 'denied',
          'audio-capture': 'denied',
          'no-speech': 'no-speech',
          'network': 'network'
        };
        if (e.error !== 'aborted') console.warn('[Chatbot] STT error:', e.error);
        settle(map[e.error] || (best.trim() ? 'ok' : 'error'));
      };

      rec.onend = function () { settle(best.trim() ? 'ok' : 'no-speech'); };

      try {
        rec.start();
        armSilence(8000);
      } catch (e) {
        console.warn('[Chatbot] Could not start recognition:', e);
        settle('error');
      }
    });
  }

  function listen(lang) {
    return listenLive(undefined, lang).then(function (result) { return result.text || ''; });
  }

  /* ─────────────────────────────────────────────────────────
   * Inline text fallback
   * ───────────────────────────────────────────────────────── */
  function _inlineTextFallback(resolve) {
    if (_fallbackOpen) { resolve(''); return; }
    _fallbackOpen = true;
    _setState('listening');

    var mount = document.getElementById('module-mount') || document.body;
    var panel = document.createElement('div');
    panel.id = 'chatbot-text-fallback';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Type your question');
    panel.innerHTML = [
      '<div class="chatbot-fallback-backdrop"></div>',
      '<div class="chatbot-fallback-box">',
      '  <p class="chatbot-fallback-label">',
      '    ' + (window.StoryLabUI ? window.StoryLabUI.icon('mic') : ''),
      '    Voice is not available — type your question',
      '  </p>',
      '  <div class="chatbot-fallback-row">',
      '    <input id="chatbot-fallback-input" type="text" class="chatbot-fallback-input"',
      '      placeholder="Type here…" autocomplete="off" autofocus />',
      '    <button id="chatbot-fallback-submit" class="btn btn-primary chatbot-fallback-btn">SEND</button>',
      '    <button id="chatbot-fallback-cancel" class="btn btn-secondary chatbot-fallback-btn">CANCEL</button>',
      '  </div>',
      '</div>'
    ].join('\n');

    mount.appendChild(panel);

    var input  = document.getElementById('chatbot-fallback-input');
    var submit = document.getElementById('chatbot-fallback-submit');
    var cancel = document.getElementById('chatbot-fallback-cancel');
    if (input) setTimeout(function () { input.focus(); }, 60);

    function close(value) {
      _fallbackOpen = false;
      _setState('idle');
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      resolve(value || '');
    }

    if (submit) submit.addEventListener('click', function () {
      close(input ? input.value.trim() : '');
    });
    if (cancel) cancel.addEventListener('click', function () { close(''); });
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); close(input.value.trim()); }
      if (e.key === 'Escape') { close(''); }
    });
  }

  /* ─────────────────────────────────────────────────────────
   * Topic library — grouped by subject, one icon per topic
   * ───────────────────────────────────────────────────────── */
  var CATEGORIES = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'math', label: 'Math', icon: 'plus' },
    { id: 'science', label: 'Science', icon: 'flask' },
    { id: 'world', label: 'World', icon: 'compass' },
    { id: 'everyday', label: 'Everyday', icon: 'chat' }
  ];

  var TOPICS = [
    {
      id: 'greeting', category: 'everyday', icon: 'chat', question: 'Namaste',
      answer: 'Namaste! I am your StoryLab tutor. Ask me about math, science, the world, or everyday life.',
      keywords: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'greet', 'good morning']
    },
    {
      id: 'division', category: 'math', icon: 'plus', question: 'Explain division',
      answer: 'Division splits a number into equal groups. 50 shared by 8 gives 6 groups with 2 left over, so we say 6 remainder 2.',
      keywords: ['division', 'divide', 'dividing', 'quotient', 'remainder', 'share equally']
    },
    {
      id: 'fractions', category: 'math', icon: 'plus', question: 'What is a fraction?',
      answer: 'A fraction is part of a whole. The top number says how many parts you have. The bottom number says how many equal parts there are. Three quarters means 3 out of 4 equal parts.',
      keywords: ['fraction', 'numerator', 'denominator', 'quarter', 'half']
    },
    {
      id: 'multiplication', category: 'math', icon: 'plus', question: 'How does multiplication work?',
      answer: 'Multiplication is repeated addition. 6 times 8 means adding 6 eight times, which gives 48. The answer is called the product.',
      keywords: ['multiplication', 'multiply', 'times table', 'product']
    },
    {
      id: 'addition', category: 'math', icon: 'plus', question: 'Teach me addition',
      answer: 'Addition joins numbers to make a total. 35 plus 27 is 62. Line up the ones with the ones and the tens with the tens, and carry over when a column passes nine.',
      keywords: ['addition', 'add numbers', 'plus', 'sum of']
    },
    {
      id: 'subtraction', category: 'math', icon: 'minus', question: 'How do I subtract?',
      answer: 'Subtraction finds the difference between two numbers. 50 minus 18 is 32. Check it by adding back: 32 plus 18 gives 50 again.',
      keywords: ['subtraction', 'subtract', 'minus', 'take away', 'difference between']
    },
    {
      id: 'shapes', category: 'math', icon: 'grid', question: 'Name some shapes',
      answer: 'A square has four equal sides and four corners. A triangle has three sides. A circle has one curved edge and no corners. A rectangle has four corners but only opposite sides are equal.',
      keywords: ['shape', 'square', 'triangle', 'circle', 'rectangle']
    },
    {
      id: 'photosynthesis', category: 'science', icon: 'leaf', question: 'What is photosynthesis?',
      answer: 'Plants make their own food using sunlight, water from the soil, and carbon dioxide from the air. The green colour in leaves, chlorophyll, captures the sunlight. Oxygen is released as a bonus.',
      keywords: ['photosynthesis', 'plant food', 'chlorophyll', 'how plants eat', 'leaves make food']
    },
    {
      id: 'water-cycle', category: 'science', icon: 'flask', question: 'What is the water cycle?',
      answer: 'The sun heats water, which rises as vapour. This is evaporation. High up it cools into cloud drops, called condensation. When the drops are heavy they fall as rain, which is precipitation.',
      keywords: ['water cycle', 'evaporation', 'condensation', 'precipitation', 'rain comes', 'cloud']
    },
    {
      id: 'solar-system', category: 'science', icon: 'compass', question: 'Tell me about the solar system',
      answer: 'Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is third, and Jupiter is the largest.',
      keywords: ['solar system', 'planet', 'mars', 'jupiter', 'saturn', 'orbit', 'space']
    },
    {
      id: 'gravity', category: 'science', icon: 'flask', question: 'What is gravity?',
      answer: 'Gravity is the force that pulls objects towards each other. Earth pulls everything towards its centre, which is why a ball falls down and why we stay on the ground.',
      keywords: ['gravity', 'why things fall', 'weight', 'pull of the earth']
    },
    {
      id: 'matter', category: 'science', icon: 'flask', question: 'What are solids, liquids and gases?',
      answer: 'Solids keep their shape, like ice. Liquids flow and take the shape of their container, like water. Gases spread out to fill any space, like the air around you.',
      keywords: ['solid', 'liquid', 'gas', 'matter', 'states of matter']
    },
    {
      id: 'thunder', category: 'science', icon: 'spark', question: 'Why do we see lightning before thunder?',
      answer: 'Light travels much faster than sound. You see the flash almost at once, but the sound of thunder takes longer to reach you. Count the seconds between them to guess how far the storm is.',
      keywords: ['lightning', 'thunder', 'storm', 'sound travel']
    },
    {
      id: 'maps', category: 'world', icon: 'compass', question: 'How do I read a map?',
      answer: 'A map shows a place seen from above. It uses a compass rose for direction, a scale for distance, and symbols for things like schools, rivers, and roads. Up is usually north.',
      keywords: ['map', 'compass', 'direction', 'north', 'scale', 'symbols']
    },
    {
      id: 'seasons', category: 'world', icon: 'calendar', question: 'Why do seasons change?',
      answer: 'Earth leans slightly as it travels around the Sun. When your side of Earth leans towards the Sun you get summer, and when it leans away you get winter.',
      keywords: ['season', 'summer', 'winter', 'monsoon', 'why it is hot']
    },
    {
      id: 'oceans', category: 'world', icon: 'compass', question: 'How many oceans are there?',
      answer: 'There are five oceans: the Pacific, Atlantic, Indian, Southern, and Arctic. The Pacific is the largest and the Arctic is the smallest.',
      keywords: ['ocean', 'sea', 'pacific', 'atlantic', 'indian ocean']
    },
    {
      id: 'panchayat', category: 'world', icon: 'shield', question: 'What is a village panchayat?',
      answer: 'A panchayat is a group of elected people who look after local matters in a village, such as water, roads, and schools. Villagers discuss a problem, then vote on what to do.',
      keywords: ['panchayat', 'village meeting', 'local government', 'sarpanch']
    },
    {
      id: 'healthy-food', category: 'everyday', icon: 'leaf', question: 'What should I eat to stay healthy?',
      answer: 'Fill your plate with grains, dal or beans, vegetables, and fruit, and drink water through the day. Try to eat different colours each day and keep sweets for special occasions.',
      keywords: ['healthy food', 'diet', 'nutrition', 'what to eat', 'fruits and vegetables']
    },
    {
      id: 'water-saving', category: 'everyday', icon: 'database', question: 'How can I save water?',
      answer: 'Close the tap while brushing, fix leaking taps, and collect rainwater for plants. Small habits every day save a lot of water over a year.',
      keywords: ['save water', 'water waste', 'rainwater', 'tap']
    },
    {
      id: 'sleep', category: 'everyday', icon: 'moon', question: 'How much sleep do I need?',
      answer: 'Children need about 9 to 11 hours of sleep each night. Sleep helps you remember what you learned, keeps your mood steady, and helps you grow.',
      keywords: ['sleep', 'bedtime', 'tired', 'rest']
    },
    {
      id: 'exercise', category: 'everyday', icon: 'spark', question: 'Why should I play outside?',
      answer: 'Playing outside builds strong muscles and bones and gives your eyes a rest from screens. About an hour of active play every day is enough.',
      keywords: ['exercise', 'play outside', 'sport', 'fitness']
    },
    {
      id: 'reading', category: 'everyday', icon: 'book', question: 'Why should I read every day?',
      answer: 'Reading grows your vocabulary and helps you understand other subjects. Even ten minutes a day, in any language, makes a difference.',
      keywords: ['reading', 'books', 'library', 'vocabulary']
    }
  ];

  function _matchTopic(transcript) {
    var lower = String(transcript || '').toLowerCase();
    for (var i = 0; i < TOPICS.length; i++) {
      var topic = TOPICS[i];
      var words = _keywordsFor(topic);
      for (var j = 0; j < words.length; j++) {
        var word = String(words[j]).toLowerCase();
        if (lower.indexOf(word) !== -1 || _hasWord(lower, words[j])) {
          return topic;
        }
      }
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────
   * mount(root) — tutor screen
   * ───────────────────────────────────────────────────────── */
  function mount(root) {
    _unmounted = false;
    _listening = false;
    _queryToken += 1;
    _category = 'all';
    if (_queryTimer) { clearTimeout(_queryTimer); _queryTimer = null; }
    _root = root;

    var icon = window.StoryLabUI ? window.StoryLabUI.icon : function () { return ''; };
    var esc = _esc;
    var S = _S();

    root.innerHTML = [
      '<div class="panel chatbot-panel" id="cb-panel">',
      '  <div class="panel__header">',
      '    <span class="panel__label">' + esc(S.panel) + '</span>',
      '    <div class="chatbot-langbar" role="group" aria-label="Answer language">',
      LANGS.map(function (l) {
        var on = l.id === _lang();
        return '      <button type="button" class="chatbot-lang' + (on ? ' is-active' : '') + '"' +
          ' data-lang="' + l.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(l.label) + '</button>';
      }).join(''),
      '    </div>',
      '    <span class="chatbot-ai" id="cb-ai-badge">AI</span>',
      '    <span class="led led--ok" id="cb-state-led" aria-hidden="true"></span>',
      '  </div>',
      '  <div class="chatbot-body">',

      '    <div class="chatbot-wave-wrap" aria-hidden="true">',
      '      <div id="chatbot-waveform" class="waveform" data-state="idle">',
      '        <span class="waveform__bar"></span><span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span><span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span><span class="waveform__bar"></span>',
      '        <span class="waveform__bar"></span>',
      '      </div>',
      '      <span class="chatbot-wave-label text-mono" id="cb-wave-label">' + esc(S.ready) + '</span>',
      '    </div>',

      '    <div class="chatbot-heard" id="cb-heard" hidden>',
      '      <span class="mono-label">' + esc(S.heard) + '</span>',
      '      <span id="cb-heard-text"></span>',
      '    </div>',

      '    <div class="chatbot-readout" id="chatbot-readout" role="log" aria-live="polite" aria-atomic="false">',
      '      <div class="chatbot-readout__line chatbot-readout__line--system">',
      '        <span class="chatbot-readout__who">TUTOR</span>',
      '        <span class="chatbot-readout__text">' + esc(S.intro) + '</span>',
      '      </div>',
      '    </div>',

      '    <div class="chatbot-topics">',
      '      <div class="chatbot-cats" role="tablist" aria-label="Topic categories">',
      CATEGORIES.map(function (cat) {
        var active = cat.id === _category;
        return '        <button type="button" class="chatbot-cat' + (active ? ' is-active' : '') + '"' +
          ' role="tab" aria-selected="' + (active ? 'true' : 'false') + '" data-cat="' + cat.id + '">' +
          icon(cat.icon) + esc(_catLabel(cat)) + '</button>';
      }).join('\n'),
      '      </div>',
      '      <div class="chatbot-chips" id="cb-chips" role="list" aria-label="Suggested questions"></div>',
      '    </div>',

      '    <div class="chatbot-controls">',
      '      <button class="btn btn-primary chatbot-speak-btn" id="cb-speak-btn">',
      '        ' + icon('mic') + ' ' + esc(S.speak),
      '      </button>',
      '      <button class="btn btn-secondary" id="cb-type-btn">',
      '        ' + icon('chat') + ' ' + esc(S.type),
      '      </button>',
      '      <button class="btn btn-secondary" id="cb-stop-btn" disabled>',
      '        ' + icon('x') + ' ' + esc(S.stop),
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    var speakBtn = document.getElementById('cb-speak-btn');
    var typeBtn  = document.getElementById('cb-type-btn');
    var stopBtn  = document.getElementById('cb-stop-btn');
    if (speakBtn) speakBtn.addEventListener('click', _handleAsk);
    if (typeBtn)  typeBtn.addEventListener('click', _handleType);
    _refreshAIStatus();

    if (stopBtn) stopBtn.addEventListener('click', function () {
      _queryToken += 1;
      _listening = false;
      if (_queryTimer) { clearTimeout(_queryTimer); _queryTimer = null; }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (_activeRec) { try { _activeRec.stop(); } catch (e) {} }
      _stopMeter();
      _setState('idle');
      _setWaveLabel(_S().ready);
      _setControls(false);
    });

    var langBtns = root.querySelectorAll('[data-lang]');
    for (var li = 0; li < langBtns.length; li++) {
      langBtns[li].addEventListener('click', function (event) {
        var next = event.currentTarget.getAttribute('data-lang');
        if (!next || next === _lang()) return;
        _listening = false;
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (_activeRec) { try { _activeRec.stop(); } catch (e) {} }
        var saving = (window.StoryLabState && window.StoryLabState.setLanguage)
          ? window.StoryLabState.setLanguage(next)
          : Promise.resolve();
        Promise.resolve(saving).then(function () {
          if (_unmounted) return;
          var host = _root || root;
          mount(host);
          speak(_S().switched);
        });
      });
    }

    var cats = root.querySelectorAll('[data-cat]');
    for (var i = 0; i < cats.length; i++) {
      cats[i].addEventListener('click', function (event) {
        _category = event.currentTarget.getAttribute('data-cat') || 'all';
        var all = _root.querySelectorAll('[data-cat]');
        for (var k = 0; k < all.length; k++) {
          var active = all[k].getAttribute('data-cat') === _category;
          all[k].classList.toggle('is-active', active);
          all[k].setAttribute('aria-selected', active ? 'true' : 'false');
        }
        _renderChips();
      });
    }

    if (!_lessonContext) {
      try {
        var saved = sessionStorage.getItem('storylab:lesson-context');
        if (saved) _lessonContext = JSON.parse(saved);
      } catch (e) { /* private mode */ }
    }
    if (_lessonContext) {
      _appendLine('system', 'About this lesson: ' + (_lessonContext.title || _lessonContext.text));
    }

    _renderChips();
  }

  function _renderChips() {
    if (!_root) return;
    var chips = document.getElementById('cb-chips');
    if (!chips) return;
    var icon = window.StoryLabUI ? window.StoryLabUI.icon : function () { return ''; };

    var topics = _category === 'all'
      ? TOPICS
      : TOPICS.filter(function (t) { return t.category === _category; });

    chips.innerHTML = topics.map(function (t) {
      return '<button type="button" class="chatbot-chip" role="listitem" data-topic="' + _esc(t.id) + '">' +
        icon(t.icon) + '<span>' + _esc(_question(t)) + '</span></button>';
    }).join('\n');

    var buttons = chips.querySelectorAll('[data-topic]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', _handleChip);
    }
  }

  /* ─────────────────────────────────────────────────────────
   * unmount()
   * ───────────────────────────────────────────────────────── */
  function unmount() {
    _unmounted = true;
    _queryToken += 1;
    if (_queryTimer) { clearTimeout(_queryTimer); _queryTimer = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (_activeRec) { try { _activeRec.stop(); } catch (e) {} _activeRec = null; }
    _stopMeter();
    _setState('idle');
    _listening = false;
    _showHeard('');
    _fallbackOpen = false;
    var fb = document.getElementById('chatbot-text-fallback');
    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);
    _root = null;
  }

  /* ─────────────────────────────────────────────────────────
   * Screen interaction
   * ───────────────────────────────────────────────────────── */
  function _handleChip(event) {
    if (_state === 'listening') return;
    var id = event.currentTarget.getAttribute('data-topic');
    var topic = null;
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].id === id) { topic = TOPICS[i]; break; }
    }
    if (topic) _runQuery(topic.question, topic);
  }

  function _handleAsk() {
    if (_listening) return;
    var S = _S();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    _queryToken += 1;
    if (_queryTimer) { clearTimeout(_queryTimer); _queryTimer = null; }
    _setState('idle');
    _listening = true;
    _setControls(true);
    _setWaveLabel(S.listening);
    _showHeard('');
    _appendLine('system', S.listeningLine);
    _startMeter();

    listenLive(function (live) {
      if (_unmounted) return;
      _showHeard(live);
      _setWaveLabel(S.listening);
    }).then(function (result) {
      _listening = false;
      _stopMeter();
      if (_unmounted) return;
      _setControls(false);
      _setWaveLabel(S.ready);
      if (!result || !result.text) {
        _showHeard('');
        _appendLine('system', S[result && result.reason] || S.heardNone);
        return;
      }
      _showHeard(result.text);
      _runQuery(result.text, null);
    });
  }

  function _runQuery(transcript, topic) {
    if (_unmounted) return;
    var token = ++_queryToken;
    if (_queryTimer) { clearTimeout(_queryTimer); _queryTimer = null; }

    var S = _S();
    _appendLine('you', transcript);
    _setState('thinking');
    _setWaveLabel(S.thinking);
    _setControls(true);

    function localAnswer() {
      var match = topic || _matchTopic(transcript);
      return match ? _answerFor(match) : '';
    }

    function remember(answer) {
      _history.push({ role: 'user', content: transcript });
      _history.push({ role: 'assistant', content: answer });
      _history = _history.slice(-6);
    }

    function speakAndSettle(answer) {
      _setWaveLabel(_S().speaking);
      speak(answer).then(function () {
        if (_unmounted || token !== _queryToken) return;
        _setControls(false);
        _setWaveLabel(_S().ready);
      });
    }

    /* A tapped starter question is answered from the saved library: instant and
     * free. Anything the student says or types goes to the AI tutor first. */
    if (topic) {
      _queryTimer = setTimeout(function () {
        _queryTimer = null;
        if (_unmounted || token !== _queryToken) return;
        var answer = localAnswer() || S.notSure;
        _appendLine('tutor', answer);
        speakAndSettle(answer);
      }, 320);
      return;
    }

    /* Stream the answer into the readout so the student sees words while the
     * model is still thinking. */
    var line = _appendLine('tutor', '');
    var textEl = line ? line.querySelector('.chatbot-readout__text') : null;

    function onDelta(partial) {
      if (_unmounted || token !== _queryToken || !textEl) return;
      textEl.textContent = partial;
      var readout = document.getElementById('chatbot-readout');
      if (readout) readout.scrollTop = readout.scrollHeight;
    }

    _askAI(transcript, onDelta).then(function (answer) {
      if (_unmounted || token !== _queryToken) return;
      var finalText = answer || localAnswer() || S.notSure;
      if (textEl) textEl.textContent = finalText;
      remember(finalText);
      speakAndSettle(finalText);
    });
  }

  /* Context from StoryLearn or the Virtual Lab: the next questions can be about
   * the step the student is looking at. */
  function setLessonContext(context) {
    _lessonContext = context && context.text
      ? { title: String(context.title || ''), text: String(context.text) }
      : null;
    try {
      if (_lessonContext) sessionStorage.setItem('storylab:lesson-context', JSON.stringify(_lessonContext));
      else sessionStorage.removeItem('storylab:lesson-context');
    } catch (e) { /* private mode */ }
  }

  /* ─────────────────────────────────────────────────────────
   * AI tutor — server proxy keeps the API key off the device
   * ───────────────────────────────────────────────────────── */
  function _askAI(question, onDelta) {
    if (!window.fetch) return Promise.resolve('');
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 30000);

    return fetch('/api/tutor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: question,
        language: _lang(),
        history: _history.slice(-6),
        context: _lessonContext ? _lessonContext.text : '',
        stream: true
      }),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      _setAIBadge(response.ok ? 'online' : 'offline');
      if (!response.ok) return '';

      /* Older browsers without streams fall back to the JSON response. */
      if (!response.body || typeof response.body.getReader !== 'function' || !window.TextDecoder) {
        return response.json().then(function (data) {
          return data && typeof data.answer === 'string' ? data.answer.trim() : '';
        });
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var text = '';
      var done = false;

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done || done) return text;
          buffer += decoder.decode(chunk.value, { stream: true });

          var index;
          while ((index = buffer.indexOf('\n')) !== -1) {
            var line = buffer.slice(0, index).trim();
            buffer = buffer.slice(index + 1);
            if (line.indexOf('data:') !== 0) continue;
            var data = line.slice(5).trim();
            if (data === '[DONE]') { done = true; return text; }
            try {
              var parsed = JSON.parse(data);
              if (parsed && parsed.delta) {
                text += parsed.delta;
                if (typeof onDelta === 'function') onDelta(text);
              }
            } catch (error) { /* partial frame */ }
          }

          return pump();
        });
      }

      return pump();
    }).catch(function () {
      _setAIBadge('offline');
      return '';
    }).then(function (answer) {
      clearTimeout(timer);
      return answer;
    }, function () {
      clearTimeout(timer);
      return '';
    });
  }

  function _refreshAIStatus() {
    if (!window.fetch) { _setAIBadge('offline'); return; }
    var attempts = 0;

    /* The demo server may still be starting when the screen mounts, so retry a
     * couple of times before telling the student the tutor is offline. */
    function check() {
      attempts += 1;
      fetch('/api/tutor/health', { cache: 'no-store' }).then(function (response) {
        return response.ok ? response.json() : null;
      }).then(function (data) {
        if (data && data.configured) { _setAIBadge('online'); return; }
        if (attempts < 3) { setTimeout(check, 2000); return; }
        _setAIBadge('offline');
      }).catch(function () {
        if (attempts < 3) { setTimeout(check, 2000); return; }
        _setAIBadge('offline');
      });
    }

    check();
  }

  function _setAIBadge(state) {
    var badge = document.getElementById('cb-ai-badge');
    if (!badge) return;
    var online = state === 'online';
    var S = _S();
    badge.textContent = online ? S.aiOnline : S.aiOffline;
    badge.classList.toggle('is-online', online);
    badge.classList.toggle('is-offline', !online);
    badge.setAttribute('title', online
      ? 'Questions are answered by the AI tutor.'
      : 'AI tutor not connected — answers come from the saved topics.');
  }

  function _handleType() {
    if (_listening) return;
    _listening = true;
    _inlineTextFallback(function (text) {
      _listening = false;
      if (_unmounted) return;
      _setControls(false);
      if (!text) return;
      _showHeard(text);
      _runQuery(text, null);
    });
  }

  /* Live microphone level — proves audio is actually reaching the browser
   * before recognition returns any words. */
  function _startMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    var wave = document.getElementById('chatbot-waveform');
    if (!wave) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (_unmounted || !_listening) {
        stream.getTracks().forEach(function (track) { try { track.stop(); } catch (e) {} });
        return;
      }
      _micStream = stream;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      _micCtx = new Ctx();
      var source = _micCtx.createMediaStreamSource(stream);
      var analyser = _micCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      var buffer = new Uint8Array(analyser.frequencyBinCount);
      wave.setAttribute('data-live', '1');

      function tick() {
        if (!_listening || !_micStream) return;
        analyser.getByteTimeDomainData(buffer);
        var sum = 0;
        for (var i = 0; i < buffer.length; i++) {
          var value = (buffer[i] - 128) / 128;
          sum += value * value;
        }
        var rms = Math.min(1, Math.sqrt(sum / buffer.length) * 4);
        wave.style.setProperty('--mic-level', rms.toFixed(3));
        _micRAF = requestAnimationFrame(tick);
      }
      tick();
    }).catch(function (error) {
      console.warn('[Chatbot] Microphone level unavailable:', error.name);
    });
  }

  function _stopMeter() {
    if (_micRAF) { cancelAnimationFrame(_micRAF); _micRAF = null; }
    var wave = document.getElementById('chatbot-waveform');
    if (wave) {
      wave.removeAttribute('data-live');
      wave.style.removeProperty('--mic-level');
    }
    if (_micCtx) { try { _micCtx.close(); } catch (e) {} _micCtx = null; }
    if (_micStream) {
      _micStream.getTracks().forEach(function (track) { try { track.stop(); } catch (e) {} });
      _micStream = null;
    }
  }

  function _appendLine(who, text) {
    var readout = document.getElementById('chatbot-readout');
    if (!readout) return;

    var whoMap = { you: 'YOU', tutor: 'TUTOR', system: 'SYS' };
    var line = document.createElement('div');
    line.className = 'chatbot-readout__line chatbot-readout__line--' + who;
    line.innerHTML =
      '<span class="chatbot-readout__who">' + _esc(whoMap[who] || who.toUpperCase()) + '</span>' +
      '<span class="chatbot-readout__text">' + _esc(text) + '</span>';
    readout.appendChild(line);

    while (readout.querySelectorAll('.chatbot-readout__line').length > MAX_LINES) {
      var first = readout.querySelector('.chatbot-readout__line');
      if (!first) break;
      first.parentNode.removeChild(first);
    }

    readout.scrollTop = readout.scrollHeight;
    return line;
  }

  function _setWaveLabel(label) {
    var el = document.getElementById('cb-wave-label');
    if (el) el.textContent = label;
  }

  function _showHeard(text) {
    var box = document.getElementById('cb-heard');
    var slot = document.getElementById('cb-heard-text');
    if (!box || !slot) return;
    if (!text) {
      box.hidden = true;
      slot.textContent = '';
      return;
    }
    slot.textContent = text;
    box.hidden = false;
  }

  function _setControls(busy) {
    var speakBtn = document.getElementById('cb-speak-btn');
    var stopBtn  = document.getElementById('cb-stop-btn');
    if (speakBtn) speakBtn.disabled = busy;
    if (stopBtn)  stopBtn.disabled  = !busy;
  }

  Object.defineProperty(window, 'Chatbot', {
    value: {
      speak: speak,
      listen: listen,
      listenLive: listenLive,
      setLessonContext: setLessonContext,
      mount: mount,
      unmount: unmount,
      get state() { return _state; }
    },
    writable: false,
    configurable: false
  });

  console.log('[Chatbot] window.Chatbot ready');
})();
