
import React, { useState } from 'react';
import { I18N, Icons } from '../constants';
import { Language, UserProfile } from '../types';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  language: Language;
  onLogin: (profile: UserProfile) => void;
  onSkip: () => void;
}

const Login: React.FC<LoginProps> = ({ language, onLogin, onSkip }) => {
  const t = I18N[language];
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        // El listener en App.tsx manejará el cambio de estado
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Error de autenticación";
      if (err.code === 'auth/invalid-email') msg = "Email inválido";
      if (err.code === 'auth/wrong-password') msg = "Contraseña incorrecta";
      if (err.code === 'auth/user-not-found') msg = "Usuario no encontrado";
      if (err.code === 'auth/email-already-in-use') msg = "Este email ya está registrado";
      if (err.code === 'auth/weak-password') msg = "La contraseña es muy débil";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white flex flex-col p-8 overflow-y-auto hide-scrollbar">
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        {/* Animated Logo */}
        <div className="mb-12 relative">
          <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-3xl shadow-blue-600/30 animate-pulse text-white">
            <span className="text-4xl font-black">U</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-gray-50 dark:border-[#0B0F14]"></div>
        </div>

        <h1 className="text-4xl font-black tracking-tighter mb-2 text-center">
          {isRegistering ? "Crear Cuenta" : t.loginTitle}
        </h1>
        <p className="text-base opacity-40 font-medium mb-12 text-center max-w-[280px]">
          {isRegistering ? "Únete a UrbanFlow y domina tu ciudad" : t.loginSubtitle}
        </p>

        {/* Form */}
        <div className="w-full space-y-4 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t.email}</label>
            <div className="bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 rounded-3xl p-5 focus-within:border-blue-500/50 transition-all">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="bg-transparent w-full outline-none font-medium placeholder:opacity-20 text-gray-900 dark:text-white" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t.password}</label>
            <div className="bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 rounded-3xl p-5 focus-within:border-blue-500/50 transition-all">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent w-full outline-none font-medium placeholder:opacity-20 text-gray-900 dark:text-white" 
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-xs font-bold text-center p-2 bg-red-500/10 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <button 
          onClick={handleAuth}
          disabled={isLoading || !email || !password}
          className="w-full py-5 bg-blue-600 rounded-[28px] font-black text-lg text-white shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isRegistering ? "Registrarse" : t.signIn)}
        </button>

        <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="mt-4 text-xs font-bold text-blue-500">
          {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Nuevo aquí? Regístrate"}
        </button>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/5"></div>
          <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">O</span>
          <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/5"></div>
        </div>

        {/* Social Auth */}
        <div className="w-full grid grid-cols-2 gap-4">
          <button className="py-4 bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Icons.Google />
            <span className="text-xs font-bold">Google</span>
          </button>
          <button className="py-4 bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Icons.Apple />
            <span className="text-xs font-bold">Apple</span>
          </button>
        </div>
      </div>

      <button 
        onClick={onSkip}
        className="py-4 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
      >
        {t.guestMode}
      </button>
    </div>
  );
};

export default Login;
