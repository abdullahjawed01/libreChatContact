import mongoose, { Schema } from 'mongoose';
const ContactSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});
const Contact = mongoose.model('ContactTest1', ContactSchema);
await mongoose.connect('mongodb://127.0.0.1:27017/librechat_contacts_test');
try {
  const doc = new Contact({ id: '1234', name: 'Test' });
  console.log("Doc id before save:", doc.id);
  await doc.save();
  console.log("Saved successfully");
} catch(e) {
  console.error("Error:", e.message);
}
await mongoose.disconnect();
