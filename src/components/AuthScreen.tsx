/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Card } from './Card';
import { Button } from './Button';
import { Shield, Mail, Lock, User, Sparkles, Compass, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (userId: string, userEmail: string, userName?: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg('Por favor, insira o seu nome.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Register user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(credential.user.uid, email, name.trim());
      } else {
        // Sign in user
        const credential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(credential.user.uid, email);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          <div className="space-y-1 text-left">
            <p className="font-bold">Provedor de Email Desativado!</p>
            <p className="text-[10px] leading-relaxed">
              O login por Email/Senha não está ativo neste projeto Firebase. Ative "E-mail/Senha" no{' '}
              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0204191673/authentication/providers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-white font-bold"
              >
                Firebase Console
              </a> para habilitar.
            </p>
          </div>
        );
      } else {
        let friendlyError = 'Ocorreu um erro na autenticação. Tente novamente.';
        if (err.code === 'auth/email-already-in-use') {
          friendlyError = 'Este endereço de email já está em uso.';
        } else if (err.code === 'auth/invalid-email') {
          friendlyError = 'O endereço de email fornecido é inválido.';
        } else if (err.code === 'auth/weak-password') {
          friendlyError = 'A senha digitada é muito fraca (mínimo de 6 caracteres).';
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          friendlyError = 'Credenciais incorretas. Verifique seu email e senha.';
        } else if (err.code === 'auth/invalid-credential') {
          friendlyError = 'Dados de login inválidos. Por favor, verifique.';
        }
        setErrorMsg(friendlyError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousAuth = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const credential = await signInAnonymously(auth);
      onAuthSuccess(credential.user.uid, 'visitante@ridermax.app', 'Motorista Convidado');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          <div className="space-y-1 text-left">
            <p className="font-bold">Acesso Convidado Desativado!</p>
            <p className="text-[10px] leading-relaxed">
              O acesso de Convidado (Anônimo) não está ativo neste projeto Firebase. Ative o provedor "Anônimo" no{' '}
              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0204191673/authentication/providers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-white font-bold"
              >
                Firebase Console
              </a> para usar esta opção.
            </p>
          </div>
        );
      } else {
        setErrorMsg('Não foi possível conectar de forma offline. Verifique a internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      onAuthSuccess(
        credential.user.uid, 
        credential.user.email || 'usuario-google@ridermax.app', 
        credential.user.displayName || 'Motorista Google'
      );
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          <div className="space-y-1 text-left">
            <p className="font-bold">Provedor Google Desativado!</p>
            <p className="text-[10px] leading-relaxed">
              O login com o Google não está ativo neste projeto Firebase. Ative o provedor "Google" no{' '}
              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0204191673/authentication/providers" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-white font-bold"
              >
                Firebase Console
              </a> para habilitar.
            </p>
          </div>
        );
      } else {
        setErrorMsg('Erro ao autenticar com o Google: ' + (err.message || err.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-6 py-12 relative overflow-hidden select-none">
      
      {/* Background visual glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        
        {/* Branding Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-red-500 items-center justify-center font-black text-slate-950 text-2xl shadow-xl shadow-red-500/20 mb-2">
            R
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">RIDERMAX</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            O painel de bordo definitivo para controle financeiro de condutores profissionais.
          </p>
        </div>

        {/* Credentials Form Box */}
        <Card variant="glass" className="p-6 border-slate-900 bg-slate-900/50 backdrop-blur-md space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              {isSignUp ? 'Criar Nova Conta' : 'Conectar ao Painel'}
            </h2>
            <p className="text-[10px] text-slate-500 leading-normal">
              {isSignUp ? 'Cadastre-se para sincronizar seus dados em nuvem.' : 'Insira seus dados para sincronizar suas corridas e gastos.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {/* Name Input - SignUp Only */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">SEU NOME</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">EMAIL DE ACESSO</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="motorista@rota.app"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">SENHA INDIVIDUAL</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"><Lock className="w-4 h-4" /></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Minimo 6 digitos"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              type="submit" 
              disabled={isLoading}
              className="py-3.5 mt-2 font-black tracking-wide bg-red-500 text-slate-950 hover:bg-red-400 font-sans shadow-md"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                isSignUp ? 'Criar Minha Conta' : 'Acessar Painel RiderMax'
              )}
            </Button>

          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800/80"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">ou</span>
            <div className="flex-grow border-t border-slate-800/80"></div>
          </div>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="py-3 border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/40 text-slate-200 font-black text-xs flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4 text-red-500" />
            Entrar com o Google
          </Button>

          {/* Toggle between register and login */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors focus:outline-none"
            >
              {isSignUp ? 'Já tem uma conta? Faça Login' : 'Novo no RiderMax? Registre-se grátis'}
            </button>
          </div>
        </Card>

        {/* Demo Mode trigger */}
        <div className="text-center">
          <button
            onClick={handleAnonymousAuth}
            disabled={isLoading}
            className="text-xs font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 font-mono flex items-center justify-center gap-1.5 mx-auto py-2 transition-colors focus:outline-none"
          >
            <Compass className="w-4 h-4" />
            Entrar como Convidado (Modo Demonstração)
          </button>
        </div>

      </div>
    </div>
  );
};
