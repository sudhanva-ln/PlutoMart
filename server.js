import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const mockProducts = [
  { id: 1, name: 'Cyber Neon Jacket', price: 120.99, description: 'High-tech glow jacket.', image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80' },
  { id: 2, name: 'Haptic Gloves', price: 85.50, description: 'Feel the digital world.', image_url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=500&q=80' },
  { id: 3, name: 'Optical Visor', price: 210.00, description: 'Augmented reality vision.', image_url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=500&q=80' },
];

app.get('/api/products', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('p_name', ascending = true);
      if (error) throw error;
      return res.json(data);
    } catch (err) {
      console.error('Supabase error, falling back to mock data', err);
      return res.json(mockProducts);
    }
  } else {
    
    setTimeout(() => res.json(mockProducts), 500); 
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (supabase) {
    try {
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const { data, error } = await supabase.from('users').insert([{ email, name, password }]).select().single();
      if (error) throw error;

      return res.status(201).json({ message: 'User created successfully', user: { name: data.name, email: data.email } });
    } catch (err) {
      console.error('Supabase signup error:', err);
      return res.status(500).json({ error: 'Server error during signup' });
    }
  } else {
    
    return res.status(201).json({ message: 'Mock user created', user: { name, email } });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (supabase) {
    try {
      const { data: user, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      return res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (err) {
      console.error('Supabase login error:', err);
      return res.status(500).json({ error: 'Server error during login' });
    }
  } else {
    
    if (email && password) {
      return res.json({ message: 'Mock login successful', user: { name: 'Mock User', email } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});


app.post('/api/orders', async (req, res) => {
  const { email, items } = req.body;

  if (supabase) {
    try {
      
      const { data: maxRecord, error: maxError } = await supabase
        .from('orders')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) throw maxError;

      let nextId = maxRecord ? parseInt(maxRecord.id) + 1 : 1;

      
      const rowsToInsert = items.map(item => {
        const productId = item.p_id || item.id;
        const row = { id: nextId, p_id: productId, email };
        nextId++; 
        return row;
      });

      
      const { data, error } = await supabase.from('orders').insert(rowsToInsert).select();
      if (error) throw error;

      return res.status(201).json({ message: 'Order placed successfully', data });
    } catch (err) {
      console.error('Supabase order error:', err);
      return res.status(500).json({ error: 'Server error placing order' });
    }
  } else {
    
    return res.status(201).json({ message: 'Mock order placed' });
  }
});

app.get('/api/orders', async (req, res) => {
  const { email } = req.query;

  if (supabase && email) {
    try {
      const { data, error } = await supabase.from('orders').select('*,products(*)').eq('email', email);
      if (error) throw error;
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Server error fetching orders' });
    }
  }
  return res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//
