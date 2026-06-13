import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type Todo = { id: number; name: string };

export default function Todos(): JSX.Element {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase.from<Todo>('todos').select('*');
      if (error) {
        console.error('Error fetching todos', error);
        return;
      }
      if (mounted && data) setTodos(data as Todo[]);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
