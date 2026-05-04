## TO DO List

1. Implement Screenshot extraction using Gemini AI. DONE

2. Use notification to remind the Amal in times. 
3. Track Amal and show statics in months to check how many times you miss your Amal.

```
One-time setup
1. VAPID key — Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair. Add to .env.local:


VITE_FIREBASE_VAPID_KEY=BNxxxxxxx...
2. Set your app URL in Cloud Functions:


firebase functions:params:set APP_URL=https://your-app.web.app
3. Deploy functions (requires Blaze plan):


cd functions && npm run build && cd ..
firebase deploy --only functions
4. Create a Firestore index for the collection group query (Firebase Console will show a link in the Functions logs the first time it runs — click it to auto-create).
```

4. Create a predefined Dua list. DONE
5. Create an Admin acees. DONE
6. Only Admin can add Dua to the predefined list.  DONE


