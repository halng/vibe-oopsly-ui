import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Users, Play, Trophy, X, ChevronRight, CheckCircle2, User, 
  MonitorPlay, ShieldAlert, Copy, Share2
} from 'lucide-react';
import { UserProfile, Subject, Card } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface MultiplayerLobbyModalProps {
  user: UserProfile;
  mode: 'HOST' | 'JOIN';
  hostSubject?: Subject;
  hostCards?: Card[];
  joinRoomCode?: string;
  onClose: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  user,
  mode,
  hostSubject,
  hostCards,
  joinRoomCode,
  onClose
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [roomCodeInput, setRoomCodeInput] = useState(joinRoomCode || '');
  
  // Game Play State for Players
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean } | null>(null);
  
  const [options, setOptions] = useState<string[]>([]);
  const countdownInterval = useRef<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(15);

  useEffect(() => {
    // Connect to same host that served the page
    const newSocket = io();
    setSocket(newSocket);

    if (mode === 'HOST' && hostSubject && hostCards) {
      newSocket.emit('host:create_quiz', {
        hostId: user.id,
        hostName: user.displayName,
        subjectId: hostSubject.id,
        subjectTitle: hostSubject.title,
        cards: hostCards
      });
    } else if (mode === 'JOIN' && joinRoomCode) {
      newSocket.emit('player:join', {
        roomCode: joinRoomCode,
        playerId: user.id,
        playerName: user.displayName
      });
    }

    newSocket.on('host:quiz_created', (quiz) => setGameState(quiz));
    newSocket.on('player:joined', ({ quiz }) => setGameState(quiz));
    newSocket.on('quiz:state_updated', (quiz) => {
      setGameState(quiz);
      
      // Reset player question state
      if (quiz.state === 'QUESTION') {
        setSelectedAnswer(null);
        setAnswerResult(null);
        setTimeRemaining(15);
        
        // Generate options (1 correct, 3 random incorrect)
        if (quiz.currentQuestionIndex >= 0) {
          const currentCard = quiz.cards[quiz.currentQuestionIndex];
          const allBacks = quiz.cards.map((c: any) => c.back).filter((b: string) => b !== currentCard.back);
          
          // Shuffle backs
          const shuffledBacks = allBacks.sort(() => 0.5 - Math.random());
          const distractors = shuffledBacks.slice(0, 3);
          
          const newOpts = [currentCard.back, ...distractors].sort(() => 0.5 - Math.random());
          setOptions(newOpts);
          
          // Start timer
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          countdownInterval.current = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (quiz.state === 'LEADERBOARD') {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
      }
    });
    
    newSocket.on('player:error', (msg) => setError(msg));
    newSocket.on('quiz:host_disconnected', () => setError('Host disconnected. The game has ended.'));
    
    newSocket.on('player:answer_received', (res) => {
      setAnswerResult(res);
    });

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      newSocket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (socket && roomCodeInput.length === 6) {
      setError(null);
      socket.emit('player:join', {
        roomCode: roomCodeInput,
        playerId: user.id,
        playerName: user.displayName
      });
    }
  };

  const handleStartGame = () => {
    if (socket && gameState?.roomCode) {
      socket.emit('host:start_quiz', gameState.roomCode);
    }
  };
  
  const handleNextQuestion = () => {
    if (socket && gameState?.roomCode) {
      socket.emit('host:next_question', gameState.roomCode);
    }
  };

  const handleSubmitAnswer = (answer: string) => {
    if (socket && gameState?.roomCode && !selectedAnswer) {
      setSelectedAnswer(answer);
      socket.emit('player:submit_answer', {
        roomCode: gameState.roomCode,
        answer
      });
    }
  };

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopyLink = async () => {
    if (!gameState) return;
    const url = `${window.location.origin}/?pin=${gameState.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareToCommunity = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Connection Error</h3>
          <p className="text-stone-500 dark:text-stone-400">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Pre-join state for player
  if (mode === 'JOIN' && !gameState) {
    return (
      <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col relative overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <MonitorPlay className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-black text-center text-stone-900 dark:text-stone-100 mb-2">Join Game</h2>
          <p className="text-stone-500 text-center mb-6 text-sm">Enter the 6-digit room code from the host.</p>
          
          <input
            type="text"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-4xl tracking-[0.25em] font-black bg-stone-100 dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 rounded-2xl py-4 focus:outline-none focus:border-blue-500 transition-colors mb-6"
          />
          
          <button
            onClick={handleJoin}
            disabled={roomCodeInput.length !== 6}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-lg transition-all"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const isHost = mode === 'HOST';

  return (
    <div className="fixed inset-0 z-[100] bg-stone-100 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-black text-stone-900 dark:text-stone-100">{gameState.subjectTitle}</h1>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
              {isHost ? 'Host View' : 'Player View'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-lg tracking-wider border border-blue-200 dark:border-blue-800">
            PIN: {gameState.roomCode}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 font-bold text-sm text-stone-700 dark:text-stone-300">
            <Users className="w-4 h-4" />
            {gameState.players.length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col">
        
        {/* LOBBY STATE */}
        {gameState.state === 'LOBBY' && (
          <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
            {isHost ? (
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12 bg-white dark:bg-stone-900/50 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm w-full">
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-100 shrink-0">
                  <QRCodeSVG value={`${window.location.origin}/?pin=${gameState.roomCode}`} size={160} level="M" />
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h2 className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
                    Join at <span className="text-blue-600 dark:text-blue-400">Oopsly</span>
                  </h2>
                  <p className="text-2xl text-stone-500 dark:text-stone-400 font-medium mb-6">
                    PIN: <span className="font-mono font-black text-stone-900 dark:text-stone-100 tracking-wider">{gameState.roomCode}</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <button 
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button 
                      onClick={handleShareToCommunity}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold transition-colors"
                    >
                      {shared ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      <span>{shared ? 'Invited!' : 'Invite Community'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-6xl font-black text-stone-900 dark:text-stone-100 mb-4 tracking-tight">
                  Join at <span className="text-blue-600 dark:text-blue-400">Oopsly</span>
                </h2>
                <p className="text-xl text-stone-500 dark:text-stone-400 font-medium">
                  with Game PIN: <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{gameState.roomCode}</span>
                </p>
              </div>
            )}
            
            {isHost && (
              <button 
                onClick={handleStartGame}
                disabled={gameState.players.length === 0}
                className="mb-12 px-12 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Start Game
              </button>
            )}

            {!isHost && (
              <div className="mb-12 text-center text-xl font-bold text-stone-600 dark:text-stone-400 animate-pulse">
                Waiting for host to start...
              </div>
            )}
            
            <div className="w-full flex flex-wrap justify-center gap-4">
              {gameState.players.map((p: any) => (
                <div key={p.id} className="px-6 py-3 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 font-bold text-lg text-stone-800 dark:text-stone-200 flex items-center gap-3 animate-in zoom-in duration-300">
                  <User className="w-5 h-5 text-stone-400" />
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTION STATE */}
        {gameState.state === 'QUESTION' && (
          <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">
            {isHost ? (
              // HOST VIEW
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <div className="text-6xl font-black text-stone-900 dark:text-stone-100 mb-12 max-w-4xl leading-tight">
                  {gameState.cards[gameState.currentQuestionIndex].front}
                </div>
                
                <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
                   <div className="bg-rose-500 h-32 rounded-2xl shadow-md"></div>
                   <div className="bg-blue-500 h-32 rounded-2xl shadow-md"></div>
                   <div className="bg-amber-500 h-32 rounded-2xl shadow-md"></div>
                   <div className="bg-emerald-500 h-32 rounded-2xl shadow-md"></div>
                </div>
                
                <div className="mt-12 text-2xl font-bold text-stone-500">
                  Answers received: {gameState.players.filter((p:any) => p.currentAnswer).length} / {gameState.players.length}
                </div>
              </div>
            ) : (
              // PLAYER VIEW
              <div className="flex flex-col flex-1 h-full">
                {selectedAnswer ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {answerResult ? (
                      <div className="animate-in zoom-in duration-300">
                        {answerResult.isCorrect ? (
                          <>
                            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-emerald-500/20">
                              <CheckCircle2 className="w-16 h-16" />
                            </div>
                            <h2 className="text-4xl font-black text-emerald-600 dark:text-emerald-400">Correct!</h2>
                          </>
                        ) : (
                          <>
                            <div className="w-32 h-32 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-rose-500/20">
                              <X className="w-16 h-16" />
                            </div>
                            <h2 className="text-4xl font-black text-rose-600 dark:text-rose-400">Incorrect</h2>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="animate-pulse text-2xl font-bold text-stone-600 dark:text-stone-400">
                        Waiting for others...
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-black shadow-lg ${timeRemaining <= 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100'}`}>
                        {timeRemaining}
                      </div>
                    </div>
                    <div className="text-3xl font-black text-center text-stone-900 dark:text-stone-100 mb-8 px-4 leading-tight">
                      {gameState.cards[gameState.currentQuestionIndex].front}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      {options.map((opt, idx) => {
                        const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSubmitAnswer(opt)}
                            className={`${colors[idx]} hover:brightness-110 active:brightness-90 text-white font-bold text-xl sm:text-2xl p-6 sm:p-10 rounded-2xl shadow-md transition-all text-center min-h-[120px]`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD STATE */}
        {gameState.state === 'LEADERBOARD' && (
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center">
            <Trophy className="w-20 h-20 text-amber-500 mb-6" />
            <h2 className="text-4xl font-black text-stone-900 dark:text-stone-100 mb-12">Leaderboard</h2>
            
            <div className="w-full space-y-4">
              {[...gameState.players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div key={p.id} className={`flex items-center justify-between p-6 rounded-2xl bg-white dark:bg-stone-800 shadow-sm border ${idx === 0 ? 'border-amber-400 shadow-amber-400/20' : 'border-stone-200 dark:border-stone-700'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black ${idx === 0 ? 'text-amber-500' : 'text-stone-400'}`}>
                        #{idx + 1}
                      </span>
                      <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{p.name}</span>
                    </div>
                    <span className="text-2xl font-black text-stone-900 dark:text-stone-100">{p.score}</span>
                  </div>
              ))}
            </div>
            
            {isHost && (
              <button 
                onClick={handleNextQuestion}
                className="mt-12 px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl flex items-center gap-2"
              >
                Next Question
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {!isHost && (
              <div className="mt-12 text-center text-lg font-bold text-stone-500 animate-pulse">
                Waiting for host to continue...
              </div>
            )}
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState.state === 'FINISHED' && (
          <div className="max-w-3xl mx-auto w-full flex flex-col items-center text-center">
             <div className="text-6xl mb-6">🎉</div>
             <h2 className="text-5xl font-black text-stone-900 dark:text-stone-100 mb-4">Podium</h2>
             <p className="text-xl text-stone-500 mb-12">The game has ended!</p>
             
             <div className="flex items-end justify-center gap-4 sm:gap-8 h-64 mb-12 w-full">
               {(() => {
                 const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
                 const first = sorted[0];
                 const second = sorted[1];
                 const third = sorted[2];
                 
                 return (
                   <>
                     {second && (
                       <div className="flex flex-col items-center justify-end h-full">
                         <span className="font-bold text-stone-800 dark:text-stone-200 mb-2 truncate max-w-[100px]">{second.name}</span>
                         <span className="font-black text-stone-500 mb-2">{second.score}</span>
                         <div className="w-20 sm:w-24 h-[60%] bg-stone-300 dark:bg-stone-700 rounded-t-xl flex justify-center pt-4">
                           <span className="text-4xl font-black text-stone-50 dark:text-stone-800">2</span>
                         </div>
                       </div>
                     )}
                     {first && (
                       <div className="flex flex-col items-center justify-end h-full">
                         <span className="font-bold text-stone-800 dark:text-stone-200 mb-2 truncate max-w-[120px] text-lg">{first.name}</span>
                         <span className="font-black text-amber-500 mb-2">{first.score}</span>
                         <div className="w-24 sm:w-32 h-[100%] bg-amber-400 rounded-t-xl flex justify-center pt-4 shadow-lg shadow-amber-500/20 z-10">
                           <span className="text-5xl font-black text-amber-100">1</span>
                         </div>
                       </div>
                     )}
                     {third && (
                       <div className="flex flex-col items-center justify-end h-full">
                         <span className="font-bold text-stone-800 dark:text-stone-200 mb-2 truncate max-w-[100px]">{third.name}</span>
                         <span className="font-black text-stone-500 mb-2">{third.score}</span>
                         <div className="w-20 sm:w-24 h-[40%] bg-stone-300 dark:bg-stone-700/80 rounded-t-xl flex justify-center pt-4">
                           <span className="text-4xl font-black text-stone-50 dark:text-stone-800">3</span>
                         </div>
                       </div>
                     )}
                   </>
                 )
               })()}
             </div>
             
             <button 
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-colors"
              >
                Return to Home
              </button>
          </div>
        )}
      </div>
    </div>
  );
};
