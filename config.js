// Firebase project config — safe to be public; access is controlled by
// Firestore security rules, not by hiding these values.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9OCKXK8OZu8Vz-lxkAiJh-nZVzOWuRJU",
  authDomain: "trip-af733.firebaseapp.com",
  projectId: "trip-af733",
  storageBucket: "trip-af733.firebasestorage.app",
  messagingSenderId: "870457044792",
  appId: "1:870457044792:web:9fe9885f4fd8bcabf49bcd",
};

// Photo uploads go through ImgBB instead of Firebase Storage (which now
// requires a billing-enabled Blaze plan even for free-tier usage).
const IMGBB_API_KEY = "f1ca58b362e55f3102707e4004b0bb4f";
