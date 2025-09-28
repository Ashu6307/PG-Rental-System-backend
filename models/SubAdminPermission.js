import mongoose from 'mongoose';

const SubAdminPermissionSchema = new mongoose.Schema({
  subadmin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  module: { type: String, required: true },
  can_view: { type: Boolean, default: false },
  can_edit: { type: Boolean, default: false },
  can_approve: { type: Boolean, default: false }
});

export default mongoose.model('SubAdminPermission', SubAdminPermissionSchema);
