/**
 * StoryLab Voice — Internationalisation (i18n) Engine
 * Supports: English (en), Hindi (hi), Marathi (mr)
 * Offline-first: 100% bundled locally with zero cloud dependencies.
 */
;(function () {
  'use strict';

  var SUPPORTED = ['en', 'hi', 'mr'];
  var LANG_MAP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

  var TRANSLATIONS = {
    en: {
      /* Navigation & Shell */
      'nav.home': 'HOME',
      'nav.progress': 'PROGRESS',
      'nav.intro': 'INTRO',
      'shell.brand_sub': 'LEARNING APP / v1.0',
      'shell.offline_mode': 'OFFLINE MODE',
      'shell.offline_sub': 'Everything still works. Progress is saved on this device.',
      'shell.offline_code': 'SAVED · WILL UPLOAD',
      'shell.online': 'ONLINE',
      'shell.offline': 'OFFLINE',
      'shell.student': 'STUDENT',
      'shell.install': 'INSTALL',
      'shell.update_ready': 'UPDATE READY',
      'shell.cache_ready': 'CACHE READY',
      'shell.caching': 'CACHING',
      'shell.footer_credits': 'WORKS OFFLINE / NO ACCOUNT',

      /* Control Deck / Home */
      'deck.eyebrow': 'STUDENT /',
      'deck.greeting_morning': 'Good morning',
      'deck.greeting_afternoon': 'Good afternoon',
      'deck.greeting_evening': 'Good evening',
      'deck.sub_continue': 'Pick up where you left off, or open something new.',
      'deck.sub_start': 'Start with a story, ask the tutor, or finish the short intro first.',
      'deck.tag_saved': 'SAVED ON THIS DEVICE',
      'deck.tag_timer_run': 'TIMER RUNNING',
      'deck.tag_no_timer': 'NO TIMER',
      'deck.station_time': 'LOCAL TIME',
      'deck.station_net': 'INTERNET',
      'deck.station_timer': 'TIMER',
      'deck.station_upload': 'TO UPLOAD',
      'deck.station_waiting': 'WAITING',
      'deck.station_all_sent': 'ALL SENT',
      'deck.station_mic': 'MIC',
      'deck.station_verified': 'VERIFIED',
      'deck.station_touch': 'TOUCH MODE',
      'deck.station_not_tested': 'NOT TESTED',
      'deck.directive_next': 'NEXT /',
      'deck.directive_intro_title': 'Intro / First Shift',
      'deck.directive_intro_desc': 'Five quick cards on how the tablet, the voice tutor, and the virtual lab work.',
      'deck.directive_intro_cta': 'START INTRO',
      'deck.directive_story_title': 'Start your first story',
      'deck.directive_story_desc': 'Pick a subject and listen to a short story. One question inside.',
      'deck.directive_story_cta': 'OPEN STORIES',
      'deck.learn_title': 'Learn',
      'deck.learn_meta': '3 MODULES / WORKS OFFLINE',
      'deck.bay_story_title': 'Stories',
      'deck.bay_story_desc': 'Voice-guided stories with one question inside.',
      'deck.bay_story_count': 'STORIES',
      'deck.bay_story_subjects': 'SUBJECTS',
      'deck.bay_story_done': 'DONE',
      'deck.bay_story_new': 'NEW',
      'deck.bay_tutor_title': 'Voice Tutor',
      'deck.bay_tutor_desc': 'Ask anything. Answers out loud, without internet.',
      'deck.bay_tutor_always': 'ALWAYS ON',
      'deck.bay_tutor_mode': 'VOICE + TOUCH',
      'deck.bay_tutor_offline': 'OFFLINE',
      'deck.bay_lab_title': 'Virtual Lab',
      'deck.bay_lab_desc': 'Try science experiments on screen. No apparatus needed.',
      'deck.bay_lab_experiments': 'EXPERIMENTS',
      'deck.bay_open': 'OPEN',
      'deck.progress_title': 'Your progress',
      'deck.progress_link': 'OPEN FULL RECORD',
      'deck.card_student': 'Student',
      'deck.card_numbers': 'Numbers',
      'deck.card_status': 'Status',
      'deck.on_device': 'ON THIS DEVICE',
      'deck.live': 'LIVE',
      'deck.intro_done': 'GETTING STARTED DONE',
      'deck.intro_pending': 'GETTING STARTED',
      'deck.field_grade': 'GRADE',
      'deck.field_lang': 'LANGUAGE',
      'deck.field_sessions': 'SESSIONS',
      'deck.field_closed': 'CLOSED',
      'deck.field_since': 'MEMBER SINCE',
      'deck.field_completed': 'COMPLETED',
      'deck.field_stories_labs': 'Stories + labs',
      'deck.field_time': 'TIME ON TASK',
      'deck.field_badges': 'BADGES',
      'deck.earned_locally': 'Earned locally',
      'deck.earn_first': 'Earn your first',
      'deck.field_saved_data': 'Saved data',
      'deck.field_ready': 'READY',

      /* StoryLearn */
      'story.hero_title': 'Pick a story',
      'story.hero_sub': 'stories · subjects · works offline',
      'story.all': 'All',
      'story.math': 'Math',
      'story.science': 'Science',
      'story.social': 'Social Studies',
      'story.evs': 'EVS',
      'story.open_story': 'OPEN STORY',
      'story.back_library': '← ALL STORIES',
      'story.restart': 'START OVER',
      'story.next_step': 'NEXT',
      'story.listening': 'Listening… speak your answer',
      'story.hint': 'Hint:',
      'story.completed_title': 'Story complete!',
      'story.badge_earned': 'Badge earned:',

      /* Virtual Lab */
      'lab.header': 'VIRTUAL LAB / CHOOSE AN EXPERIMENT',
      'lab.sub': 'A guided virtual laboratory. Follow each instruction, identify the materials and observe the reaction.',
      'lab.start_btn': 'START EXPERIMENT →',
      'lab.back_home': '← BACK HOME',
      'lab.watch': 'Watch the apparatus, follow the steps and finish the experiment.',
      'lab.speak_hint': 'You can also tap an answer instead of speaking.',
      'lab.listening_mic': 'Listening… speak clearly into your microphone.',
      'lab.complete_title': 'Experiment Complete!',
      'lab.complete_msg': 'Excellent work! You have completed the experiment. Your progress has been saved.',
      'lab.reset': 'RUN AGAIN',
      'lab.finish': 'DONE',

      /* Progress Record */
      'record.title': 'My progress',
      'record.sub': 'Everything saved on this tablet: sessions, lessons, and uploads.',
      'record.export': 'EXPORT JSON',
      'record.print': 'PRINT',
      'record.sessions': 'SESSIONS',
      'record.time_on_task': 'TIME ON TASK',
      'record.completed': 'COMPLETED',
      'record.to_upload': 'TO UPLOAD',
      'record.sync_now': 'SYNC NOW',
      'record.settings': 'DEVICE SETTINGS',
      'record.replay_intro': 'REPLAY INTRO',
      'record.reset_device': 'RESET DEVICE'
    },

    hi: {
      /* Navigation & Shell */
      'nav.home': 'होम',
      'nav.progress': 'प्रगति',
      'nav.intro': 'परिचय',
      'shell.brand_sub': 'शिक्षा ऐप / v1.0',
      'shell.offline_mode': 'ऑफ़लाइन मोड',
      'shell.offline_sub': 'सब कुछ काम कर रहा है। डेटा इसी डिवाइस पर सुरक्षित है।',
      'shell.offline_code': 'सुरक्षित · अपलोड होगा',
      'shell.online': 'ऑनलाइन',
      'shell.offline': 'ऑफ़लाइन',
      'shell.student': 'विद्यार्थी',
      'shell.install': 'इंस्टॉल',
      'shell.update_ready': 'अपडेट तैयार',
      'shell.cache_ready': 'कैश तैयार',
      'shell.caching': 'कैश हो रहा है',
      'shell.footer_credits': 'बिना इंटरनेट चलेगा / बिना खाते के',

      /* Control Deck / Home */
      'deck.eyebrow': 'विद्यार्थी /',
      'deck.greeting_morning': 'सुप्रभात',
      'deck.greeting_afternoon': 'नमस्ते',
      'deck.greeting_evening': 'शुभ संध्या',
      'deck.sub_continue': 'जहाँ छोड़ा था वहाँ से शुरू करें, या कुछ नया सीखें।',
      'deck.sub_start': 'एक कहानी से शुरू करें, ट्यूटर से पूछें, या पहले परिचय पूरा करें।',
      'deck.tag_saved': 'डिवाइस पर सुरक्षित',
      'deck.tag_timer_run': 'टाइमर चालू',
      'deck.tag_no_timer': 'टाइमर बंद',
      'deck.station_time': 'स्थानीय समय',
      'deck.station_net': 'इंटरनेट',
      'deck.station_timer': 'टाइमर',
      'deck.station_upload': 'अपलोड बाकी',
      'deck.station_waiting': 'बाकी',
      'deck.station_all_sent': 'सब भेजा गया',
      'deck.station_mic': 'माइक',
      'deck.station_verified': 'सत्यापित',
      'deck.station_touch': 'टच मोड',
      'deck.station_not_tested': 'परीक्षण नहीं',
      'deck.directive_next': 'अगला /',
      'deck.directive_intro_title': 'परिचय / पहली शुरुआत',
      'deck.directive_intro_desc': 'टैबलेट, वॉइस ट्यूटर और वर्चुअल लैब कैसे काम करते हैं, इस पर 5 आसान कार्ड।',
      'deck.directive_intro_cta': 'परिचय शुरू करें',
      'deck.directive_story_title': 'अपनी पहली कहानी शुरू करें',
      'deck.directive_story_desc': 'एक विषय चुनें और छोटी कहानी सुनें। बीच में एक सवाल।',
      'deck.directive_story_cta': 'कहानियाँ खोलें',
      'deck.learn_title': 'सीखें',
      'deck.learn_meta': '3 मॉड्यूल / ऑफ़लाइन तैयार',
      'deck.bay_story_title': 'कहानियाँ',
      'deck.bay_story_desc': 'आवाज़ से चलने वाली कहानियाँ और सवाल।',
      'deck.bay_story_count': 'कहानियाँ',
      'deck.bay_story_subjects': 'विषय',
      'deck.bay_story_done': 'पूर्ण',
      'deck.bay_story_new': 'नया',
      'deck.bay_tutor_title': 'वॉइस ट्यूटर',
      'deck.bay_tutor_desc': 'कुछ भी पूछें। बिना इंटरनेट बोलकर जवाब मिलेगा।',
      'deck.bay_tutor_always': 'हमेशा तैयार',
      'deck.bay_tutor_mode': 'आवाज़ + टच',
      'deck.bay_tutor_offline': 'ऑफ़लाइन',
      'deck.bay_lab_title': 'वर्चुअल लैब',
      'deck.bay_lab_desc': 'स्क्रीन पर विज्ञान प्रयोग करें। बिना लैब उपकरणों के।',
      'deck.bay_lab_experiments': 'प्रयोग',
      'deck.bay_open': 'खोलें',
      'deck.progress_title': 'आपकी प्रगति',
      'deck.progress_link': 'पूरा रिकॉर्ड देखें',
      'deck.card_student': 'विद्यार्थी',
      'deck.card_numbers': 'आंकड़े',
      'deck.card_status': 'स्थिति',
      'deck.on_device': 'इस डिवाइस पर',
      'deck.live': 'लाइव',
      'deck.intro_done': 'परिचय पूर्ण',
      'deck.intro_pending': 'परिचय बाकी',
      'deck.field_grade': 'कक्षा',
      'deck.field_lang': 'भाषा',
      'deck.field_sessions': 'सत्र',
      'deck.field_closed': 'समाप्त',
      'deck.field_since': 'शामिल हुए',
      'deck.field_completed': 'पूर्ण',
      'deck.field_stories_labs': 'कहानियाँ + लैब',
      'deck.field_time': 'सीखने का समय',
      'deck.field_badges': 'बैज',
      'deck.earned_locally': 'यहाँ अर्जित',
      'deck.earn_first': 'पहला बैज पाएं',
      'deck.field_saved_data': 'सुरक्षित डेटा',
      'deck.field_ready': 'तैयार',

      /* StoryLearn */
      'story.hero_title': 'कहानियाँ चुनें',
      'story.hero_sub': 'कहानियाँ · विषय · ऑफ़लाइन तैयार',
      'story.all': 'सभी',
      'story.math': 'गणित',
      'story.science': 'विज्ञान',
      'story.social': 'सामाजिक अध्ययन',
      'story.evs': 'पर्यावरण',
      'story.open_story': 'कहानी खोलें',
      'story.back_library': '← सभी कहानियाँ',
      'story.restart': 'फिर से शुरू करें',
      'story.next_step': 'आगे बढ़ें',
      'story.listening': 'सुन रहा हूँ… अपना उत्तर बोलें',
      'story.hint': 'संकेत:',
      'story.completed_title': 'कहानी पूरी हुई!',
      'story.badge_earned': 'बैज मिला:',

      /* Virtual Lab */
      'lab.header': 'वर्चुअल लैब / एक प्रयोग चुनें',
      'lab.sub': 'एक निर्देशित वर्चुअल प्रयोगशाला। निर्देशों का पालन करें, पदार्थों को पहचानें और प्रतिक्रिया देखें।',
      'lab.start_btn': 'प्रयोग शुरू करें →',
      'lab.back_home': '← होम पर वापस',
      'lab.watch': 'उपकरण देखें, चरणों का पालन करें और प्रयोग पूरा करें।',
      'lab.speak_hint': 'आप बोलने के बजाय उत्तर पर टैप भी कर सकते हैं।',
      'lab.listening_mic': 'सुन रहा हूँ… माइक्रोफ़ोन में साफ़ बोलें।',
      'lab.complete_title': 'प्रयोग पूरा हुआ!',
      'lab.complete_msg': 'शाबाश! आपने प्रयोग पूरा कर लिया है। आपकी प्रगति सुरक्षित कर ली गई है।',
      'lab.reset': 'दोबारा करें',
      'lab.finish': 'समाप्त',

      /* Progress Record */
      'record.title': 'मेरी प्रगति',
      'record.sub': 'इस टैबलेट पर सुरक्षित सब कुछ: सत्र, पाठ और अपलोड।',
      'record.export': 'एक्सपोर्ट JSON',
      'record.print': 'प्रिंट',
      'record.sessions': 'सत्र',
      'record.time_on_task': 'सीखने का समय',
      'record.completed': 'पूर्ण',
      'record.to_upload': 'अपलोड बाकी',
      'record.sync_now': 'सिंक करें',
      'record.settings': 'डिवाइस सेटिंग्स',
      'record.replay_intro': 'परिचय दोबारा देखें',
      'record.reset_device': 'डिवाइस रीसेट करें'
    },

    mr: {
      /* Navigation & Shell */
      'nav.home': 'मुख्य',
      'nav.progress': 'प्रगती',
      'nav.intro': 'ओळख',
      'shell.brand_sub': 'शिक्षण ॲप / v1.0',
      'shell.offline_mode': 'ऑफलाइन मोड',
      'shell.offline_sub': 'सर्व काही कार्य करत आहे. प्रगती या डिव्हाइसवर जतन केली आहे.',
      'shell.offline_code': 'जतन · अपलोड होईल',
      'shell.online': 'ऑनलाइन',
      'shell.offline': 'ऑफलाइन',
      'shell.student': 'विद्यार्थी',
      'shell.install': 'इन्स्टॉल',
      'shell.update_ready': 'अपडेट तयार',
      'shell.cache_ready': 'कॅश तयार',
      'shell.caching': 'कॅश होत आहे',
      'shell.footer_credits': 'इंटरनेटशिवाय चालेल / खात्याची गरज नाही',

      /* Control Deck / Home */
      'deck.eyebrow': 'विद्यार्थी /',
      'deck.greeting_morning': 'शुभ सकाळ',
      'deck.greeting_afternoon': 'नमस्कार',
      'deck.greeting_evening': 'शुभ संध्याकाळ',
      'deck.sub_continue': 'जिथे थांबला होता तिथून सुरू करा, किंवा काहीतरी नवीन शिका.',
      'deck.sub_start': 'एका गोष्टीने सुरू करा, शिक्षकाला विचारा, किंवा आधी ओळख पूर्ण करा.',
      'deck.tag_saved': 'डिव्हाइसवर जतन',
      'deck.tag_timer_run': 'टाइमर सुरू',
      'deck.tag_no_timer': 'टाइमर बंद',
      'deck.station_time': 'स्थानिक वेळ',
      'deck.station_net': 'इंटरनेट',
      'deck.station_timer': 'टाइमर',
      'deck.station_upload': 'अपलोड बाकी',
      'deck.station_waiting': 'बाकी',
      'deck.station_all_sent': 'सर्व पाठवले',
      'deck.station_mic': 'माइक',
      'deck.station_verified': 'तपासले',
      'deck.station_touch': 'स्पर्श मोड',
      'deck.station_not_tested': 'तपासणी नाही',
      'deck.directive_next': 'पुढील /',
      'deck.directive_intro_title': 'ओळख / पहिली शिफ्ट',
      'deck.directive_intro_desc': 'टॅबलेट, व्हॉइस ट्यूटर आणि व्हर्च्युअल लॅब कसे चालतात यावर 5 सोपी कार्डे.',
      'deck.directive_intro_cta': 'ओळख सुरू करा',
      'deck.directive_story_title': 'पहिली गोष्ट सुरू करा',
      'deck.directive_story_desc': 'एक विषय निवडा आणि छोटी गोष्ट ऐका. मध्ये एक प्रश्न.',
      'deck.directive_story_cta': 'गोष्टी उघडा',
      'deck.learn_title': 'शिका',
      'deck.learn_meta': '3 मॉड्यूल्स / ऑफलाइन उपलब्ध',
      'deck.bay_story_title': 'गोष्टी',
      'deck.bay_story_desc': 'आवाजासह गोष्टी आणि प्रश्न.',
      'deck.bay_story_count': 'गोष्टी',
      'deck.bay_story_subjects': 'विषय',
      'deck.bay_story_done': 'पूर्ण',
      'deck.bay_story_new': 'नवीन',
      'deck.bay_tutor_title': 'व्हॉइस ट्यूटर',
      'deck.bay_tutor_desc': 'काहीही विचारा. इंटरनेटशिवाय बोलून उत्तर मिळेल.',
      'deck.bay_tutor_always': 'नेहमी सुरू',
      'deck.bay_tutor_mode': 'आवाज + स्पर्श',
      'deck.bay_tutor_offline': 'ऑफलाइन',
      'deck.bay_lab_title': 'व्हर्च्युअल लॅब',
      'deck.bay_lab_desc': 'स्क्रीनवर विज्ञानाचे प्रयोग करा. उपकरणांशिवाय.',
      'deck.bay_lab_experiments': 'प्रयोग',
      'deck.bay_open': 'उघडा',
      'deck.progress_title': 'तुमची प्रगती',
      'deck.progress_link': 'संपूर्ण नोंद पहा',
      'deck.card_student': 'विद्यार्थी',
      'deck.card_numbers': 'आकडेवारी',
      'deck.card_status': 'स्थिती',
      'deck.on_device': 'या डिव्हाइसवर',
      'deck.live': 'थेट',
      'deck.intro_done': 'ओळख पूर्ण',
      'deck.intro_pending': 'ओळख बाकी',
      'deck.field_grade': 'इयत्ता',
      'deck.field_lang': 'भाषा',
      'deck.field_sessions': 'सत्र',
      'deck.field_closed': 'पूर्ण',
      'deck.field_since': 'नोंदणी तारीख',
      'deck.field_completed': 'पूर्ण',
      'deck.field_stories_labs': 'गोष्टी + लॅब',
      'deck.field_time': 'अभ्यासाची वेळ',
      'deck.field_badges': 'बॅजेस',
      'deck.earned_locally': 'मिळवलेले',
      'deck.earn_first': 'पहिला बॅज मिळवा',
      'deck.field_saved_data': 'जतन डेटा',
      'deck.field_ready': 'तयार',

      /* StoryLearn */
      'story.hero_title': 'गोष्टी निवडा',
      'story.hero_sub': 'गोष्टी · विषय · ऑफलाइन उपलब्ध',
      'story.all': 'सर्व',
      'story.math': 'गणित',
      'story.science': 'विज्ञान',
      'story.social': 'नागरिकशास्त्र',
      'story.evs': 'पर्यावरण',
      'story.open_story': 'गोष्ट उघडा',
      'story.back_library': '← सर्व गोष्टी',
      'story.restart': 'पुन्हा सुरू करा',
      'story.next_step': 'पुढे जा',
      'story.listening': 'ऐकत आहे… आपले उत्तर बोला',
      'story.hint': 'संकेत:',
      'story.completed_title': 'गोष्ट पूर्ण झाली!',
      'story.badge_earned': 'बॅज मिळाला:',

      /* Virtual Lab */
      'lab.header': 'व्हर्च्युअल लॅब / एक प्रयोग निवडा',
      'lab.sub': 'मार्गदर्शित व्हर्च्युअल प्रयोगशाळा. सूचनांचे पालन करा, साहित्य ओळखा आणि अभिक्रिया पहा.',
      'lab.start_btn': 'प्रयोग सुरू करा →',
      'lab.back_home': '← मुख्य पानावर परत',
      'lab.watch': 'उपकरणे पहा, पायऱ्यांचे पालन करा आणि प्रयोग पूर्ण करा.',
      'lab.speak_hint': 'तुम्ही बोलण्याऐवजी उत्तरावर टॅप करू शकता.',
      'lab.listening_mic': 'ऐकत आहे… मायक्रोफोनमध्ये स्पष्ट बोला.',
      'lab.complete_title': 'प्रयोग पूर्ण झाला!',
      'lab.complete_msg': 'छान! तुम्ही प्रयोग पूर्ण केला आहे. तुमची प्रगती जतन केली आहे.',
      'lab.reset': 'पुन्हा करा',
      'lab.finish': 'पूर्ण',

      /* Progress Record */
      'record.title': 'माझी प्रगती',
      'record.sub': 'या टॅबलेटवर जतन केलेले सर्व: सत्र, धडे आणि अपलोड.',
      'record.export': 'एक्स्पोर्ट JSON',
      'record.print': 'प्रिंट',
      'record.sessions': 'सत्र',
      'record.time_on_task': 'अभ्यासाची वेळ',
      'record.completed': 'पूर्ण',
      'record.to_upload': 'अपलोड बाकी',
      'record.sync_now': 'सिंक करा',
      'record.settings': 'डिव्हाइस सेटिंग्ज',
      'record.replay_intro': 'ओळख पुन्हा पहा',
      'record.reset_device': 'डिव्हाइस रीसेट करा'
    }
  };

  /* Story Localized Content (Title, Summary, Steps) */
  var STORIES_I18N = {
    hi: {
      'math-market': {
        title: 'बाज़ार का दिन',
        summary: 'रानी के पास 50 रुपये हैं और उसे आम खरीदने हैं।',
        steps: {
          s1: 'रानी 50 रुपये लेकर गाँव के बाज़ार गई। वह 8 रुपये प्रति आम की दर से आम खरीदना चाहती है। आइए पता लगाएं कि वह कितने आम खरीद सकती है!',
          s2: 'अगर प्रत्येक आम 8 रुपये का है, तो रानी 50 रुपये में कितने आम खरीद सकती है?',
          s2_hint: '50 को 8 से भाग देकर देखें।',
          s2_opt_0: '6 आम',
          s2_opt_1: '7 आम',
          s2_opt_2: '5 आम',
          s3_correct: 'बहुत बढ़िया! 50 को 8 से भाग देने पर 6 मिलता है और 2 रुपये शेष बचते हैं। रानी 6 आम खरीदती है और 2 रुपये बचाती है। आप एक बेहतरीन गणितज्ञ हैं!',
          s3_wrong: 'अच्छा प्रयास! फिर से सोचिए। 8 गुना 6 बराबर 48 होता है, जो 50 से कम है। 8 गुना 7 बराबर 56 होता है, जो 50 से ज़्यादा है। इसलिए रानी केवल 6 आम खरीद सकती है और 2 रुपये वापस पाएगी!',
          end: 'शानदार काम! आपने बाज़ार का दिन कहानी पूरी की। भाग हमें चीज़ों को सही-सही बाँटने में मदद करता है!'
        }
      },
      'math-fractions': {
        title: 'चार दोस्तों का पिज़्ज़ा',
        summary: 'एक पिज़्ज़ा, आठ टुकड़े और चार भूखे दोस्त।',
        steps: {
          s1: 'चार दोस्त खेलने के बाद बैठे। उनके पास एक पिज़्ज़ा है जिसके आठ बराबर टुकड़े कटे हुए हैं। वे सब बराबर खाना चाहते हैं।',
          s2: 'अगर 8 टुकड़ों को 4 दोस्तों में बराबर बाँटें, तो हर दोस्त को पिज़्ज़ा का कितना हिस्सा मिलेगा?',
          s2_hint: '8 को 4 से भाग देकर देखें।',
          s2_opt_0: '2 टुकड़े (1/4 पिज़्ज़ा)',
          s2_opt_1: '1 टुकड़ा (1/8 पिज़्ज़ा)',
          s2_opt_2: '4 टुकड़े (1/2 पिज़्ज़ा)',
          s3_correct: 'बिलकुल सही! 8 को 4 से भाग देने पर 2 मिलता है। हर दोस्त को 2 टुकड़े मिलते हैं, जो पूरे पिज़्ज़ा का एक-चौथाई यानी 2/8 हिस्सा है!',
          s3_wrong: 'सोचिए: अगर 4 दोस्त हैं और 8 टुकड़े, तो हर एक को 8 ÷ 4 = 2 टुकड़े मिलेंगे। यही भिन्न (fraction) का जादू है!',
          end: 'बधाई हो! आपने भिन्न का सबक सीख लिया। बाँटकर खाना ही सच्ची समझदारी है!'
        }
      },
      'math-shapes': {
        title: 'पतंग बनाने वाला',
        summary: 'समीर को हवा चलने से पहले चार बराबर भुजाओं वाली पतंग बनानी है।',
        steps: {
          s1: 'समीर संक्रांति के लिए पतंग बना रहा है। उसे एक ऐसा कागज़ काटना है जिसकी चारों भुजाएं बराबर हों और आमने-सामने के कोण समान हों।',
          s2: 'चार बराबर भुजाओं और चार समकोण वाली आकृति को क्या कहते हैं?',
          s2_hint: 'इसकी लंबाई और चौड़ाई दोनों एक जैसी होती हैं।',
          s2_opt_0: 'वर्ग (Square)',
          s2_opt_1: 'त्रिभुज (Triangle)',
          s2_opt_2: 'वृत्त (Circle)',
          s3_correct: 'अद्भुत! वर्ग की चारों भुजाएं बराबर होती हैं। समीर की पतंग आसमान में सबसे ऊँची उड़ेगी!',
          s3_wrong: 'त्रिभुज में 3 भुजाएं होती हैं और वृत्त गोल होता है। 4 बराबर भुजाओं वाली आकृति वर्ग (Square) होती है!',
          end: 'बहुत अच्छे! आपने ज्यामितीय आकारों की पहचान कर ली।'
        }
      },
      'science-plants': {
        title: 'पौधे धूप कैसे खाते हैं',
        summary: 'पत्ती एक रसोईघर है जो सूरज की रोशनी से खाना बनाती है।',
        steps: {
          s1: 'हरी पत्ती पेड़ का अनोखा रसोईघर है। जड़ें ज़मीन से पानी खींचती हैं और पत्ती हवा से कार्बन डाइऑक्साइड लेती है।',
          s2: 'पौधे सूरज की रोशनी में अपना भोजन किस प्रक्रिया से बनाते हैं?',
          s2_hint: 'इसे अंग्रेजी में Photosynthesis कहते हैं।',
          s2_opt_0: 'प्रकाश संश्लेषण (Photosynthesis)',
          s2_opt_1: 'वाष्पोत्सर्जन (Evaporation)',
          s2_opt_2: 'श्वसन (Respiration)',
          s3_correct: 'शाबाश! प्रकाश संश्लेषण से पौधे ग्लूकोज़ बनाते हैं और हमारे लिए ताज़ा ऑक्सीजन छोड़ते हैं!',
          s3_wrong: 'वाष्पोत्सर्जन पानी उड़ना है। सूरज की रोशनी से खाना बनाने की प्रक्रिया को प्रकाश संश्लेषण कहते हैं!',
          end: 'वाह! अब आप जानते हैं कि पेड़-पौधे हमें भोजन और प्राणवायु कैसे देते हैं।'
        }
      },
      'science-water': {
        title: 'बारिश कहाँ से आती है',
        summary: 'पानी की एक बूँद का सफर: समंदर से आसमान और फिर ज़मीन पर।',
        steps: {
          s1: 'सूरज की गरमी से समंदर और नदियों का पानी भाप बनकर ऊपर आसमान में उड़ जाता है। ऊपर जाकर यह ठंडा होकर बादल बनता है।',
          s2: 'पानी का भाप बनकर ऊपर उठना क्या कहलाता है?',
          s2_hint: 'गरम तवे पर पानी की बूँद की तरह उड़ जाना।',
          s2_opt_0: 'वाष्पीकरण (Evaporation)',
          s2_opt_1: 'अवक्षेपण (Precipitation)',
          s2_opt_2: 'संघनन (Condensation)',
          s3_correct: 'सटीक उत्तर! वाष्पीकरण से जल भाप बनता है, फिर संघनन से बादल, और अंत में बारिश होती है। इसे जल चक्र कहते हैं!',
          s3_wrong: 'बारिश गिरना अवक्षेपण है। पानी का भाप बनना वाष्पीकरण (Evaporation) कहलाता है!',
          end: 'बहुत खूब! आपने पूरे जल चक्र का रहस्य समझ लिया।'
        }
      },
      'science-solar': {
        title: 'सूरज के चारों ओर सैर',
        summary: 'सौरमंडल के आठ ग्रहों से मिलिए उनके परिक्रमा क्रम में।',
        steps: {
          s1: 'हमारा सूरज एक विशाल तारा है जिसके चारों ओर आठ ग्रह चक्कर लगाते हैं। हमारी पृथ्वी सूरज से तीसरे स्थान पर है।',
          s2: 'सौरमंडल का सबसे बड़ा ग्रह कौन सा है?',
          s2_hint: 'यह लाल धब्बे वाला भारी गैसीय ग्रह है।',
          s2_opt_0: 'बृहस्पति (Jupiter)',
          s2_opt_1: 'मंगल (Mars)',
          s2_opt_2: 'शनि (Saturn)',
          s3_correct: 'बिलकुल सही! बृहस्पति इतना बड़ा है कि उसमें सौरमंडल के बाकी सभी ग्रह समा सकते हैं!',
          s3_wrong: 'मंगल लाल ग्रह है और शनि के छल्ले हैं। सबसे बड़ा ग्रह बृहस्पति (Jupiter) है!',
          end: 'शाबाश खगोलशास्त्री! आपने सौरमंडल की यात्रा पूरी कर ली।'
        }
      },
      'social-map': {
        title: 'स्कूल बस का खोया रास्ता',
        summary: 'नक्शा पढ़िए और स्कूल बस को सही समय पर पहुँचाइए।',
        steps: {
          s1: 'ड्राइवर काका नया रास्ता भूल गए। रीमा ने स्कूल का नक्शा निकाला। नक्शे के ऊपरी हिस्से पर एक तीर बना है।',
          s2: 'नक्शे में सबसे ऊपर की दिशा आमतौर पर कौन सी होती है?',
          s2_hint: 'ध्रुव तारे की दिशा।',
          s2_opt_0: 'उत्तर (North)',
          s2_opt_1: 'दक्षिण (South)',
          s2_opt_2: 'पूर्व (East)',
          s3_correct: 'सही पहचाना! नक्शे पर ऊपर हमेशा उत्तर (North) होता है। रीमा ने सही मोड़ बताया और सब स्कूल पहुँच गए!',
          s3_wrong: 'नीचे दक्षिण होता है और दाएँ पूर्व। ऊपर हमेशा उत्तर (North) दिशा होती है!',
          end: 'शानदार दिशा-ज्ञान! नक्शा पढ़ना एक बहुत ज़रूरी हुनर है।'
        }
      },
      'social-village': {
        title: 'गाँव की सभा',
        summary: 'सब अपनी बात रखते हैं, फिर गाँव मिलकर फैसला करता है।',
        steps: {
          s1: 'बरगद के पेड़ के नीचे गाँव के सभी लोग इकट्ठा हुए। गाँव के नए कुएँ और पक्की सड़क पर चर्चा होनी है।',
          s2: 'गाँव के स्थानीय स्वशासन के चुने हुए समूह को क्या कहते हैं?',
          s2_hint: 'सरपंच इसके मुखिया होते हैं।',
          s2_opt_0: 'ग्राम पंचायत (Gram Panchayat)',
          s2_opt_1: 'नगर निगम (Municipal Corp)',
          s2_opt_2: 'संसद (Parliament)',
          s3_correct: 'उत्तम! ग्राम पंचायत गाँव की भलाई, पानी और सफ़ाई का ध्यान रखती है। सब मिलकर गाँव को सुंदर बनाते हैं!',
          s3_wrong: 'शहरों में नगर निगम और देश के लिए संसद होती है। गाँव में ग्राम पंचायत काम करती है!',
          end: 'बहुत अच्छा! लोकतंत्र की नींव गाँव की इसी एकता में है।'
        }
      },
      'evs-animals': {
        title: 'जंगल के पड़ोसी',
        summary: 'जंगल के हर जानवर के लिए सही घर और संतुलन खोजिए।',
        steps: {
          s1: 'घने जंगल में शेर गुफा में रहता है, बंदर पेड़ों पर कूदते हैं और खरगोश बिल में रहते हैं। हर जीव पर्यावरण का हिस्सा है।',
          s2: 'जो जानवर केवल पौधे और घास खाते हैं, उन्हें क्या कहा जाता है?',
          s2_hint: 'जैसे गाय, हिरण और खरगोश।',
          s2_opt_0: 'शाकाहारी (Herbivore)',
          s2_opt_1: 'मांसाहारी (Carnivore)',
          s2_opt_2: 'सर्वाहारी (Omnivore)',
          s3_correct: 'बिलकुल सही! शाकाहारी जीव पौधे खाते हैं और प्रकृति की खाद्य श्रृंखला को संतुलित रखते हैं!',
          s3_wrong: 'मांस खाने वाले मांसाहारी होते हैं। पौधे खाने वाले शाकाहारी (Herbivore) कहलाते हैं!',
          end: 'अति सुंदर! आपने पर्यावरण और पशु-जगत के संतुलन को समझ लिया।'
        }
      }
    },
    mr: {
      'math-market': {
        title: 'बाजाराचा दिवस',
        summary: 'राणीकडे 50 रुपये आहेत आणि तिला आंब्याचा स्टॉल गाठायचा आहे.',
        steps: {
          s1: 'राणी 50 रुपये घेऊन गावातील आठवडी बाजारात गेली. तिला 8 रुपये प्रत्येकी दराने आंबे खरेदी करायचे आहेत. चला शोधूया ती किती आंबे घेऊ शकेल!',
          s2: 'जर प्रत्येक आंबा 8 रुपयांचा असेल, तर राणी 50 रुपयांत किती आंबे विकत घेऊ शकते?',
          s2_hint: '50 ला 8 ने भागून पहा.',
          s2_opt_0: '6 आंबे',
          s2_opt_1: '7 आंबे',
          s2_opt_2: '5 आंबे',
          s3_correct: 'छान! 50 ला 8 ने भागले तर 6 आंबे मिळतात आणि 2 रुपये बाकी उरतात. राणी 6 आंबे घेते आणि 2 रुपये शिल्लक राहतात. तुम्ही उत्तम गणितज्ञ आहात!',
          s3_wrong: 'छान प्रयत्न! पुन्हा विचार करा. 8 गुणिले 6 बरोबर 48, जे 50 पेक्षा कमी आहे. 8 गुणिले 7 बरोबर 56, जे 50 पेक्षा जास्त आहे. म्हणून राणी फक्त 6 आंबे घेऊ शकते आणि 2 रुपये परत मिळतील!',
          end: 'उत्कृष्ट काम! तुम्ही बाजाराचा दिवस गोष्ट पूर्ण केली. भागाकार आपल्याला समान वाटणी करायला शिकवतो!'
        }
      },
      'math-fractions': {
        title: 'चार मित्रांचा पिझ्झा',
        summary: 'एक पिझ्झा, आठ तुकडे आणि चार भुकेले मित्र.',
        steps: {
          s1: 'खेळ संपवून चार मित्र एकत्र बसले. त्यांच्याकडे एक पिझ्झा आहे ज्याचे 8 समान तुकडे केलेले आहेत. सर्वांना समान वाटून खायचे आहे.',
          s2: 'जर 8 तुकडे 4 मित्रांमध्ये समान वाटले, तर प्रत्येक मित्राला पिझ्झाचा किती भाग मिळेल?',
          s2_hint: '8 ला 4 ने भागून पहा.',
          s2_opt_0: '2 तुकडे (1/4 पिझ्झा)',
          s2_opt_1: '1 तुकडा (1/8 पिझ्झा)',
          s2_opt_2: '4 तुकडे (1/2 पिझ्झा)',
          s3_correct: 'अगदी बरोबर! 8 ला 4 ने भागल्यास 2 मिळतात. प्रत्येक मित्राला 2 तुकडे मिळतात, जो संपूर्ण पिझ्झाचा पाव भाग म्हणजे 2/8 आहे!',
          s3_wrong: 'विचार करा: 4 मित्र आणि 8 तुकडे, म्हणजेच प्रत्येकाला 8 ÷ 4 = 2 तुकडे मिळतील. हाच अपूर्णांकाचा नियम आहे!',
          end: 'अभिनंदन! तुम्ही अपूर्णांकाची संकल्पना समजून घेतली. वाटून खाणे हीच खरी मैत्री!'
        }
      },
      'math-shapes': {
        title: 'पतंग बनवणारा',
        summary: 'समीरला वारा येण्यापूर्वी चार समान बाजू असलेली पतंग बनवायची आहे.',
        steps: {
          s1: 'समीर संक्रांतीसाठी पतंग बनवत आहे. त्याला असा कागद कापायचा आहे ज्याच्या चारही बाजू समान लांबीच्या असतील.',
          s2: 'चार समान बाजू आणि चार काटकोन असलेल्या आकाराला काय म्हणतात?',
          s2_hint: 'याची लांबी आणि रुंदी सारखीच असते.',
          s2_opt_0: 'चौरस (Square)',
          s2_opt_1: 'त्रिकोण (Triangle)',
          s2_opt_2: 'वर्तुळ (Circle)',
          s3_correct: 'अतिशय सुंदर! चौरसाच्या चारही बाजू समान असतात. समीरचा पतंग आकाशात सर्वात उंच उडेल!',
          s3_wrong: 'त्रिकोणाला 3 बाजू असतात आणि वर्तुळ गोल असते. 4 समान बाजू असलेला आकार चौरस (Square) असतो!',
          end: 'शाब्बास! तुम्ही भौमितिक आकारांची अचूक ओळख करून घेतली.'
        }
      },
      'science-plants': {
        title: 'वनस्पती प्रकाश कसा घेतात',
        summary: 'झाडाचे पान हे सूर्यप्रकाशावर चालणारे अन्न तयार करण्याचे स्वयंपाकघर आहे.',
        steps: {
          s1: 'हिरवे पान हे वनस्पतीचे स्वयंपाकघर आहे. मुळे जमिनीतून पाणी शोषून घेतात आणि पाने हवेतून कार्बन डायऑक्साइड घेतात.',
          s2: 'सूर्यप्रकाशात वनस्पती स्वतःचे अन्न कोणत्या प्रक्रियेने तयार करतात?',
          s2_hint: 'याला इंग्रजीत Photosynthesis म्हणतात.',
          s2_opt_0: 'प्रकाशसंश्लेषण (Photosynthesis)',
          s2_opt_1: 'बाष्पीभवन (Evaporation)',
          s2_opt_2: 'श्वसन (Respiration)',
          s3_correct: 'शाब्बास! प्रकाशसंश्लेषण प्रक्रियेतून वनस्पती अन्न बनवतात आणि आपल्यासाठी शुद्ध ऑक्सिजन सोडतात!',
          s3_wrong: 'बाष्पीभवन म्हणजे पाणी वाफ होणे. सूर्यप्रकाशातून अन्न बनवण्याच्या प्रक्रियेला प्रकाशसंश्लेषण म्हणतात!',
          end: 'छान! आता तुम्हाला समजले की झाडे आपल्याला अन्न आणि ऑक्सिजन कसे देतात.'
        }
      },
      'science-water': {
        title: 'पाऊस कुठून येतो',
        summary: 'पाण्याच्या एका थेंबाचा प्रवास: समुद्रातून आकाशात आणि परत जमिनीवर.',
        steps: {
          s1: 'सूर्याच्या उष्णतेमुळे समुद्र आणि नद्यांचे पाणी वाफ होऊन आकाशात जाते. वर थंड हवा लागल्याने ढग तयार होतात.',
          s2: 'पाणी वाफ होऊन वर जाण्याच्या प्रक्रियेला काय म्हणतात?',
          s2_hint: 'गरम तव्यावर पाण्याचा थेंब जसा नाहीसा होतो.',
          s2_opt_0: 'बाष्पीभवन (Evaporation)',
          s2_opt_1: 'पर्जन्य (Precipitation)',
          s2_opt_2: 'संघनन (Condensation)',
          s3_correct: 'अचूक उत्तर! बाष्पीभवनाने वाफ होते, संघननाने ढग बनतात आणि नंतर पाऊस पडतो. याला जलचक्र म्हणतात!',
          s3_wrong: 'पाऊस पडणे म्हणजे पर्जन्य. पाण्याची वाफ होणे याला बाष्पीभवन (Evaporation) म्हणतात!',
          end: 'उत्तम! तुम्ही निसर्गातील संपूर्ण जलचक्राचे रहस्य शिकलात.'
        }
      },
      'science-solar': {
        title: 'सूर्याभोवती एक फेरी',
        summary: 'सूर्यमालेतील आठ ग्रहांची ओळख त्यांच्या क्रमाने करून घ्या.',
        steps: {
          s1: 'आपला सूर्य हा एक मोठा तारा आहे ज्याच्याभोवती आठ ग्रह फिरतात. आपली पृथ्वी सूर्यापासून तिसऱ्या क्रमांकावर आहे.',
          s2: 'सूर्यमालेतील सर्वात मोठा ग्रह कोणता आहे?',
          s2_hint: 'या ग्रहावर तांबडा महाकाय डाग आहे.',
          s2_opt_0: 'गुरु (Jupiter)',
          s2_opt_1: 'मंगळ (Mars)',
          s2_opt_2: 'शनी (Saturn)',
          s3_correct: 'अगदी बरोबर! गुरु ग्रह इतका मोठा आहे की त्यात इतर सर्व ग्रह सामावून जाऊ शकतात!',
          s3_wrong: 'मंगळ लाल ग्रह आहे आणि शनीला कडी आहेत. सर्वात मोठा ग्रह गुरु (Jupiter) आहे!',
          end: 'शाब्बास खगोलशास्त्रज्ञ! तुम्ही सूर्यमालेची सफर यशस्वीपणे पूर्ण केली.'
        }
      },
      'social-map': {
        title: 'हरवलेला बस मार्ग',
        summary: 'नकाशा वाचा आणि शाळेची बस वेळेवर पोहोचवा.',
        steps: {
          s1: 'चालक काका नवीन रस्ता विसरले. रीमाने लगेच शाळेचा नकाशा काढला. नकाशाच्या वरच्या कोपऱ्यात एक बाण दाखवला आहे.',
          s2: 'नकाशावर सर्वात वरची दिशा कोणती असते?',
          s2_hint: 'ध्रुवतारा ज्या दिशेला असतो.',
          s2_opt_0: 'उत्तर (North)',
          s2_opt_1: 'दक्षिण (South)',
          s2_opt_2: 'पूर्व (East)',
          s3_correct: 'बरोबर ओळखले! नकाशावर वरची बाजू नेहमी उत्तर (North) दिशा दर्शवते. रीमाने योग्य वळण सांगितले आणि मुले वेळेवर पोहोचली!',
          s3_wrong: 'खाली दक्षिण आणि उजवीकडे पूर्व असते. वर नेहमी उत्तर दिशा असते!',
          end: 'उत्कृष्ट दिशाज्ञान! नकाशा वाचता येणे हे खूप महत्त्वाचे कौशल्य आहे.'
        }
      },
      'social-village': {
        title: 'गावची सभा',
        summary: 'प्रत्येक जण बोलतो, मग गाव मिळून निर्णय घेते.',
        steps: {
          s1: 'वडाच्या झाडाखाली गावचे सर्व नागरिक एकत्र आले. गावातील नवीन विहीर आणि रस्त्याच्या दुरुस्तीवर चर्चा करायची आहे.',
          s2: 'गावाच्या स्थानिक कारभारासाठी निवडलेल्या गटाला काय म्हणतात?',
          s2_hint: 'सरपंच हे या सभेचे प्रमुख असतात.',
          s2_opt_0: 'ग्रामपंचायत (Gram Panchayat)',
          s2_opt_1: 'महानगरपालिका (Municipal Corp)',
          s2_opt_2: 'संसद (Parliament)',
          s3_correct: 'उत्तम! ग्रामपंचायत गावातील पाणी, रस्ते आणि आरोग्याची काळजी घेते. एकत्र आल्याने गाव समृद्ध होते!',
          s3_wrong: 'शहरात महानगरपालिका आणि देशासाठी संसद असते. गावात ग्रामपंचायत काम पाहते!',
          end: 'छान! लोकशाहीचा पाया आपल्या गावातील या ऐक्यातच आहे.'
        }
      },
      'evs-animals': {
        title: 'जंगलातील शेजारी',
        summary: 'जंगलातील प्रत्येक प्राण्याचे योग्य घर आणि अन्नसाखळी ओळखा.',
        steps: {
          s1: 'दाट जंगलात सिंह गुहेत राहतो, माकडे झाडावर उड्या मारतात आणि ससे बिळात राहतात. प्रत्येक सजीव निसर्गाचा महत्त्वाचा भाग आहे.',
          s2: 'जे प्राणी फक्त गवत आणि वनस्पती खातात, त्यांना काय म्हणतात?',
          s2_hint: 'उदा. गाय, हरण आणि ससा.',
          s2_opt_0: 'शाकाहारी (Herbivore)',
          s2_opt_1: 'मांसाहारी (Carnivore)',
          s2_opt_2: 'मिश्राहारी (Omnivore)',
          s3_correct: 'अगदी बरोबर! शाकाहारी प्राणी वनस्पती खातात आणि निसर्गाची अन्नसाखळी संतुलित ठेवतात!',
          s3_wrong: 'मांस खाणारे मांसाहारी असतात. वनस्पती खाणाऱ्यांना शाकाहारी (Herbivore) म्हणतात!',
          end: 'सुंदर! तुम्ही पर्यावरण आणि प्राणिजगताचा समतोल चांगल्या प्रकारे समजून घेतला.'
        }
      }
    }
  };

  /* Lab Localized Content */
  var LABS_I18N = {
    hi: {
      'acid-base': {
        title: 'अम्ल-क्षार उदासीनीकरण (टाइट्रेशन)',
        duration: '5 मिनट · निर्देशित प्रयोग',
        steps: {
          1: { instruction: 'ब्यूरेट में सोडियम हाइड्रॉक्साइड (क्षार) भरें और शंक्वाकार फ्लास्क में हाइड्रोक्लोरिक एसिड रखें। फिनॉल्फथलीन की 2 बूँदें डालें।' },
          2: { instruction: 'फ्लास्क में फिनॉल्फथलीन सूचक का रंग क्या है? क्या एसिड में यह रंगहीन रहता है या गुलाबी?' },
          3: { instruction: 'स्टॉपकॉक खोलें और बूँद-बूँद क्षार डालें जब तक कि फ्लास्क का रंग हल्का गुलाबी न हो जाए। यह अंत बिंदु (End Point) है।' }
        }
      },
      'salt-dissolving': {
        title: 'पानी में नमक का घुलना',
        duration: '4 मिनट · निर्देशित प्रयोग',
        steps: {
          1: { instruction: 'बीकर में 100 मिली पानी लें और चम्मच से एक चम्मच नमक डालें।' },
          2: { instruction: 'काँच की छड़ से घोल को हिलाएं। क्या नमक के कण पानी में गायब हो रहे हैं?' },
          3: { instruction: 'नमक पूरी तरह पानी में घुलकर एक पारदर्शी समांगी मिश्रण बन गया है।' }
        }
      }
    },
    mr: {
      'acid-base': {
        title: 'आम्ल-आम्लारी उदासीनीकरण (टायट्रेशन)',
        duration: '5 मिनिटे · मार्गदर्शित प्रयोग',
        steps: {
          1: { instruction: 'ब्युरेटमध्ये सोडियम हायड्रॉक्साइड (अल्कली) भरा आणि चंबूमध्ये हायड्रोक्लोरिक आम्ल ठेवा. फिनॉल्फथॅलीनचे 2 थेंब टाका.' },
          2: { instruction: 'आम्लामध्ये फिनॉल्फथॅलीन दर्शकाचा रंग कोणता दिसतो? रंगहीन की गुलाबी?' },
          3: { instruction: 'स्टॉपकॉक उघडून हळूहळू अल्कली टाका जोपर्यंत द्रावणाचा रंग फिकट गुलाबी होत नाही. हा अंत्यबिंदू (End Point) आहे.' }
        }
      },
      'salt-dissolving': {
        title: 'पाण्यात मीठ विरघळणे',
        duration: '4 मिनिटे · मार्गदर्शित प्रयोग',
        steps: {
          1: { instruction: 'ंचंचूपात्रात 100 मिली पाणी घ्या आणि चमच्याने एक चमचा मीठ टाका.' },
          2: { instruction: 'काचेच्या कांडीने पाणी ढवळा. मिठाचे कण पाण्यात अदृश्य होत आहेत का?' },
          3: { instruction: 'मीठ पाण्यात पूर्णपणे विरघळून एक पारदर्शक समांगी द्रावण तयार झाले आहे.' }
        }
      }
    }
  };

  /* Active Language Resolver */
  function getLanguage() {
    try {
      var saved = localStorage.getItem('storylab:language');
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
      if (window.StoryLabState && typeof window.StoryLabState.getProfile === 'function') {
        var profile = window.StoryLabState.getProfile();
        if (profile && profile.language && SUPPORTED.indexOf(profile.language) !== -1) {
          return profile.language;
        }
      }
    } catch (e) {}
    return 'en';
  }

  function getLanguageTag(lang) {
    var l = lang || getLanguage();
    return LANG_MAP[l] || 'en-IN';
  }

  function t(key, fallback) {
    var lang = getLanguage();
    var dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (dict && typeof dict[key] === 'string') return dict[key];
    if (TRANSLATIONS.en && typeof TRANSLATIONS.en[key] === 'string') return TRANSLATIONS.en[key];
    return fallback !== undefined ? fallback : key;
  }

  function setLanguage(language) {
    var valid = SUPPORTED.indexOf(language) !== -1 ? language : 'en';
    try {
      localStorage.setItem('storylab:language', valid);
    } catch (e) {}

    var tag = LANG_MAP[valid] || 'en-IN';
    document.documentElement.lang = tag;
    document.documentElement.setAttribute('data-lang', valid);

    /* Persist to profile if loaded */
    if (window.StoryLabState) {
      var profile = window.StoryLabState.getProfile();
      if (profile && profile.language !== valid) {
        window.StoryLabState.saveProfile({
          language: valid,
          languageTag: tag
        }).catch(function (err) {
          console.warn('[i18n] Profile language save failed:', err);
        });
      }
    }

    /* Broadcast language change */
    var detail = { language: valid, languageTag: tag };
    window.dispatchEvent(new CustomEvent('storylab:language', { detail: detail }));

    /* Update picker buttons */
    document.querySelectorAll('[data-lang-choice]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-choice') === valid;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Sync chatbot buttons if rendered */
    document.querySelectorAll('.chatbot-lang').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === valid;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Sync record select if rendered */
    var select = document.getElementById('language-select');
    if (select && select.value !== valid) {
      select.value = valid;
    }

    /* Refresh router so active screen redraws in the new language */
    if (window.StoryLabRouter && typeof window.StoryLabRouter.refresh === 'function') {
      window.StoryLabRouter.refresh();
    }
  }

  function translateStory(story, lang) {
    var currentLang = lang || getLanguage();
    if (!story || currentLang === 'en') return story;

    var langPack = STORIES_I18N[currentLang];
    if (!langPack || !langPack[story.id]) return story;

    var translated = Object.assign({}, story);
    var pack = langPack[story.id];
    if (pack.title) translated.title = pack.title;
    if (pack.summary) translated.summary = pack.summary;

    if (pack.steps && Array.isArray(story.steps)) {
      translated.steps = story.steps.map(function (step) {
        var transStep = Object.assign({}, step);
        if (pack.steps[step.id]) transStep.text = pack.steps[step.id];
        if (pack.steps[step.id + '_hint']) transStep.hint = pack.steps[step.id + '_hint'];

        if (Array.isArray(step.options)) {
          transStep.options = step.options.map(function (opt, idx) {
            var transOpt = Object.assign({}, opt);
            var optKey = step.id + '_opt_' + idx;
            if (pack.steps[optKey]) transOpt.label = pack.steps[optKey];
            return transOpt;
          });
        }
        return transStep;
      });
    }

    return translated;
  }

  function translateLab(lab, lang) {
    var currentLang = lang || getLanguage();
    if (!lab || currentLang === 'en') return lab;

    var langPack = LABS_I18N[currentLang];
    if (!langPack || !langPack[lab.id]) return lab;

    var pack = langPack[lab.id];
    var translated = Object.assign({}, lab);
    if (pack.title) translated.title = pack.title;
    if (pack.duration) translated.duration = pack.duration;

    if (pack.steps && Array.isArray(lab.steps)) {
      translated.steps = lab.steps.map(function (step) {
        var transStep = Object.assign({}, step);
        if (pack.steps[step.step]) {
          transStep.instruction = pack.steps[step.step].instruction || transStep.instruction;
        }
        return transStep;
      });
    }

    return translated;
  }

  window.StoryLabI18n = {
    getLanguage: getLanguage,
    getLanguageTag: getLanguageTag,
    setLanguage: setLanguage,
    t: t,
    translateStory: translateStory,
    translateLab: translateLab,
    SUPPORTED: SUPPORTED
  };

  /* Initialize html lang tag */
  document.documentElement.lang = getLanguageTag();
  document.documentElement.setAttribute('data-lang', getLanguage());

  console.log('[i18n] window.StoryLabI18n ready (active: ' + getLanguage() + ')');
})();
