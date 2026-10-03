import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ybzvtpzmwpeisbwukcze:9922270869adi@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export async function initSupabase(initialUsers = [], initialComplaints = []) {
  try {
    const client = await pool.connect();
    console.log('⚡ Connected to Supabase PostgreSQL database');

    // Check users count
    const userRes = await client.query('SELECT count(*) FROM users;');
    const userCount = parseInt(userRes.rows[0].count, 10);

    if (userCount === 0 && initialUsers.length > 0) {
      console.log(`📦 Seeding ${initialUsers.length} users into Supabase...`);
      for (const u of initialUsers) {
        await client.query(
          `INSERT INTO users (id, name, email, password, role, phone, department, ward, avatar)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (email) DO NOTHING;`,
          [
            u.id,
            u.name,
            u.email,
            u.passwordHash || u.password,
            (u.role || 'CITIZEN').toLowerCase(),
            u.phone || null,
            u.departmentId || u.department || null,
            u.wardId || u.ward || null,
            u.avatar || null
          ]
        );
      }
      console.log('✅ Supabase users seeded successfully!');
    }

    // Check complaints count
    const compRes = await client.query('SELECT count(*) FROM complaints;');
    const compCount = parseInt(compRes.rows[0].count, 10);

    if (compCount === 0 && initialComplaints.length > 0) {
      console.log(`📦 Seeding ${initialComplaints.length} initial complaints into Supabase...`);
      for (const c of initialComplaints.slice(0, 30)) {
        const title = c.title || `${c.category || 'Issue'} on ${c.roadName || 'City Road'}`;
        const photo = (c.images && c.images[0]) || (c.photos && c.photos[0]) || c.image_url || null;
        await client.query(
          `INSERT INTO complaints (id, title, description, category, priority, severity_score, status, lat, lng, address, landmark, image_url, citizen_id, citizen_name, citizen_phone, upvotes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO NOTHING;`,
          [
            c.id,
            title,
            c.description || '',
            c.category || 'Pothole',
            c.severity || c.priority || 'MEDIUM',
            c.priorityScore || c.severityScore || 50,
            c.status || 'SUBMITTED',
            c.location?.lat || c.lat || 18.5204,
            c.location?.lng || c.lng || 73.8567,
            c.location?.address || c.address || 'Pune City',
            c.landmark || c.roadName || '',
            photo,
            c.citizenId || c.citizen_id || null,
            c.citizenName || c.citizen_name || 'Citizen',
            c.citizenPhone || c.citizen_phone || '',
            c.upvotes || 0,
            c.createdAt || new Date().toISOString()
          ]
        );
      }
      console.log('✅ Supabase complaints seeded successfully!');
    }

    client.release();
    return true;
  } catch (err) {
    console.warn('⚠️ Supabase sync warning (running in hybrid mode):', err.message);
    return false;
  }
}

export async function saveUserToSupabase(user) {
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, password, role, phone, department, ward, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         avatar = EXCLUDED.avatar;`,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash || user.password,
        (user.role || 'citizen').toLowerCase(),
        user.phone || null,
        user.departmentId || user.department || null,
        user.wardId || user.ward || null,
        user.avatar || null
      ]
    );
  } catch (e) {
    console.error('Error saving user to Supabase:', e.message);
  }
}

export async function saveComplaintToSupabase(complaint) {
  try {
    const title = complaint.title || `${complaint.category || 'Issue'} on ${complaint.roadName || 'City Road'}`;
    const photo = (complaint.images && complaint.images[0]) || (complaint.photos && complaint.photos[0]) || complaint.image_url || null;
    await pool.query(
      `INSERT INTO complaints (id, title, description, category, priority, severity_score, status, lat, lng, address, landmark, image_url, citizen_id, citizen_name, citizen_phone, upvotes, ai_metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         upvotes = EXCLUDED.upvotes,
         updated_at = NOW();`,
      [
        complaint.id,
        title,
        complaint.description || '',
        complaint.category || 'Other',
        complaint.severity || complaint.priority || 'MEDIUM',
        complaint.priorityScore || complaint.severityScore || 50,
        complaint.status || 'SUBMITTED',
        complaint.location?.lat || complaint.lat || 18.5204,
        complaint.location?.lng || complaint.lng || 73.8567,
        complaint.location?.address || complaint.address || '',
        complaint.landmark || complaint.roadName || '',
        photo,
        complaint.citizenId || complaint.citizen_id || null,
        complaint.citizenName || complaint.citizen_name || '',
        complaint.citizenPhone || complaint.citizen_phone || '',
        complaint.upvotes || 0,
        JSON.stringify(complaint.aiDetection || complaint.aiAnalysis || {}),
        complaint.createdAt || new Date().toISOString()
      ]
    );
  } catch (e) {
    console.error('Error saving complaint to Supabase:', e.message);
  }
}

export async function updateComplaintInSupabase(id, updates) {
  try {
    const fields = [];
    const values = [id];
    let idx = 2;

    if (updates.status) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.priority || updates.severity) {
      fields.push(`priority = $${idx++}`);
      values.push(updates.priority || updates.severity);
    }
    if (updates.upvotes !== undefined) {
      fields.push(`upvotes = $${idx++}`);
      values.push(updates.upvotes);
    }
    if (updates.resolvedImageUrl || updates.resolved_image_url || updates.afterImage) {
      fields.push(`resolved_image_url = $${idx++}`);
      values.push(updates.resolvedImageUrl || updates.resolved_image_url || updates.afterImage);
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      const query = `UPDATE complaints SET ${fields.join(', ')} WHERE id = $1;`;
      await pool.query(query, values);
    }
  } catch (e) {
    console.error('Error updating complaint in Supabase:', e.message);
  }
}

export async function saveTimelineUpdateToSupabase(update) {
  try {
    await pool.query(
      `INSERT INTO complaint_updates (id, complaint_id, status, notes, actor_name, actor_role, proof_photo, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        update.id,
        update.masterIssueId || update.complaintId || update.complaint_id,
        update.status || update.stage || 'UPDATED',
        update.notes || update.description || '',
        update.actorName || update.actor_name || 'Authority',
        update.actorRole || update.actor_role || 'AUTHORITY',
        update.proofPhoto || update.proof_photo || null,
        update.timestamp || new Date().toISOString()
      ]
    );
  } catch (e) {
    console.error('Error saving timeline update to Supabase:', e.message);
  }
}

export async function saveNotificationToSupabase(notif) {
  try {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, complaint_id, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        notif.id,
        notif.userId || notif.user_id,
        notif.title,
        notif.message,
        notif.type || 'info',
        notif.complaintId || notif.complaint_id || null,
        notif.read || false,
        notif.createdAt || new Date().toISOString()
      ]
    );
  } catch (e) {
    console.error('Error saving notification to Supabase:', e.message);
  }
}
