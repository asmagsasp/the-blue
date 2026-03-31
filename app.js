/**
 * The Blue Platform - Core Logic
 * High-performance, reactive-style Vanilla JS application
 */

// --- Integração Real: Supabase ---
(() => {
    const supabaseUrl = 'https://kggukwkireimgexsezek.supabase.co';
    const supabaseKey = 'sb_publishable_d9lFOKzv88k2Hv9roRdvZQ_X7K9xKAq';

    let supabase = null;
    if (window.supabase && supabaseUrl.startsWith('http')) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }

    // --- Global Application State ---
    const State = {
        user: null, // Initially null
        currentView: 'auth', // 'auth', 'dashboard', 'investments', 'wallet', 'referral', 'admin'
        plans: [
            { id: 'starter', name: 'Starter Blue', duration: 5, dailyReturn: 0.02, min: 50, max: 100 },
            { id: 'pro', name: 'Blue Pro', duration: 15, dailyReturn: 0.04, min: 250, max: 1000 },
            { id: 'elite', name: 'Elite Blue', duration: 30, dailyReturn: 0.06, min: 2000, max: 10000 }
        ],
        investments: [],
        transactions: [],
        referrals: { level1: [], level2: [], level3: [] },
        currentPix: null
    };

    // --- View Router & Rendering ---
    const Router = {
        navigate(view) {
            State.currentView = view;
            this.render();
            window.scrollTo(0, 0);
        },

        render() {
            const app = document.getElementById('app');
            const nav = document.getElementById('bottom-nav');

            // Logic to show/hide navigation
            if (State.user && State.currentView !== 'auth') {
                nav.style.display = 'flex';
            } else {
                nav.style.display = 'none';
            }

            // Render matching view
            switch (State.currentView) {
                case 'auth':
                    app.innerHTML = this.views.auth();
                    this.initAuthListeners();
                    break;
                case 'dashboard':
                    app.innerHTML = this.views.dashboard();
                    break;
                case 'investments':
                    app.innerHTML = this.views.investments();
                    break;
                case 'wallet':
                    app.innerHTML = this.views.wallet();
                    break;
                case 'referral':
                    app.innerHTML = this.views.referral();
                    break;
                case 'admin':
                    app.innerHTML = this.views.admin();
                    break;
                case 'pix_checkout':
                    app.innerHTML = this.views.pixCheckout();
                    break;
                case 'profile':
                    app.innerHTML = this.views.profile();
                    break;
                default:
                    app.innerHTML = '<h1>404 Not Found</h1>';
            }
        },

        views: {
            auth: () => `
            <div class="app-container animate-fade">
                <div class="auth-header" style="text-align: center; padding: 20px 0;">
                    <div class="mascot-container">
                        <div class="mascot-shape"></div>
                    </div>
                    <h1 style="color: var(--primary-blue); font-size: 3rem; margin-top: 10px;">The Blue</h1>
                    <p>O Azul que transforma seu futuro.</p>
                </div>
                
                <div id="auth-form" class="glass-card">
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button class="btn btn-outline" style="flex: 1; border-color: var(--primary-blue);" onclick="toggleAuth(true)">Cadastrar</button>
                        <button class="btn btn-outline" style="flex: 1;" onclick="toggleAuth(false)">Entrar</button>
                    </div>

                    <div id="register-fields">
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Código de Convite (Opcional)</label>
                        <input type="text" placeholder="Código de Convite" class="input-field" id="sponsor" value="${localStorage.getItem('theblue_ref') || ''}" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000" class="input-field" id="phone" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                        
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Senha de Acesso</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="password" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                        
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Senha de Saque</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="withdraw_password" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                        
                        <button class="btn btn-primary" style="width: 100%;" onclick="handleRegister()">Criar Conta Grátis</button>
                    </div>

                    <div id="login-fields" style="display: none;">
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000" class="input-field" id="login-phone" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                        
                        <label style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Senha</label>
                        <input type="password" placeholder="••••••••" class="input-field" id="login-password" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                        
                        <button class="btn btn-secondary" style="width: 100%;" onclick="handleLogin()">Acessar Plataforma</button>
                    </div>
                </div>
            </div>
        `,

            dashboard: () => `
            <div class="app-container animate-fade">
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <p style="margin-bottom: 2px;">Olá, <span style="color: white; font-weight: 600;">${State.user.phone}</span></p>
                        <h2 style="font-size: 1.2rem;">Bem-vindo ao Azul!</h2>
                    </div>
                    <div style="background: var(--glass-bg); padding: 8px; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;">
                         <i class="fa-solid fa-user-ninja" style="color: var(--primary-blue);"></i>
                    </div>
                </header>

                <!-- Balance Cards Carousel-style -->
                <div class="glass-card" style="background: linear-gradient(135deg, var(--primary-blue), #003399); border: none; margin-bottom: 20px;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Saldo Total Estimado</p>
                    <h1 style="font-size: 2.8rem; margin: 10px 0; -webkit-text-fill-color: white;">R$ ${State.user.balance.toFixed(2)}</h1>
                    <div style="display: flex; gap: 15px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <div>
                            <p style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">Disponível</p>
                            <p style="font-weight: 600;">R$ ${State.user.available.toFixed(2)}</p>
                        </div>
                        <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 15px;">
                            <p style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">Investido</p>
                            <p style="font-weight: 600;">R$ ${State.user.invested.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px;">
                    <button class="glass-card" onclick="Router.navigate('wallet')" style="padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-plus-circle" style="color: var(--secondary-orange); font-size: 1.2rem;"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Depositar</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('investments')" style="padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-bolt" style="color: var(--accent-blue); font-size: 1.2rem;"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Investir</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('wallet')" style="padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-arrow-up-from-bracket" style="color: #4CAF50; font-size: 1.2rem;"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Sacar</span>
                    </button>
                </div>

                <!-- Earning Stats -->
                <div class="glass-card" style="margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>Ganhos de Hoje</h3>
                        <span style="color: #4CAF50; font-weight: 600;">+ R$ ${(State.user.invested * 0.02).toFixed(2)}</span>
                    </div>
                    <div style="height: 60px; display: flex; align-items: flex-end; gap: 8px;">
                        ${[20, 60, 40, 80, 50, 100, 90].map(h => `<div style="flex: 1; background: var(--primary-blue); height: ${h}%; border-radius: 4px 4px 0 0; opacity: ${h / 100};"></div>`).join('')}
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">Histórico Recente</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${State.transactions.length === 0 ? '<p style="text-align: center; padding: 20px; opacity: 0.5;">Nenhuma transação ainda.</p>' : ''}
                        ${State.transactions.slice(0, 3).map(tr => `
                            <div class="glass-card" style="display: flex; align-items: center; gap: 15px; padding: 12px;">
                                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                                    <i class="fa-solid ${tr.type === 'dep' || tr.type === 'pix_pendente' ? 'fa-arrow-down' : 'fa-arrow-up'}" style="color: ${tr.type === 'dep' ? '#4CAF50' : tr.type === 'pix_pendente' ? '#FF9800' : '#FF5252'};"></i>
                                </div>
                                <div style="flex: 1;">
                                    <p style="font-size: 0.85rem; font-weight: 600;">${tr.description || tr.desc}</p>
                                    <p style="font-size: 0.7rem; opacity: 0.5;">${tr.date}</p>
                                </div>
                                <p style="font-weight: 700;">R$ ${tr.amount.toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `,

            investments: () => `
            <div class="app-container animate-fade">
                <h1 style="margin-bottom: 10px;">Planos de Investimento</h1>
                <p style="margin-bottom: 30px;">Escolha o plano ideal para seu crescimento "The Blue".</p>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${State.plans.map(p => `
                        <div class="glass-card" style="position: relative; overflow: hidden; border-left: 4px solid var(--primary-blue);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h2 style="font-size: 1.4rem; color: var(--primary-blue);">${p.name}</h2>
                                    <p style="font-size: 0.9rem;">Duração: <span style="color: white; font-weight: 600;">${p.duration} dias</span></p>
                                </div>
                                <div style="text-align: right;">
                                    <p style="color: #4CAF50; font-weight: 800; font-size: 1.2rem;">${(p.dailyReturn * 100)}% ao dia</p>
                                    <p style="font-size: 0.7rem;">Rendimento Diário</p>
                                </div>
                            </div>
                            
                            <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; display: flex; justify-content: space-between;">
                                <div>
                                    <p style="font-size: 0.7rem;">Mínimo</p>
                                    <p style="font-weight: 600;">R$ ${p.min}</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.7rem;">Máximo</p>
                                    <p style="font-weight: 600;">R$ ${p.max}</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.7rem;">Retorno Total</p>
                                    <p style="font-weight: 700; color: var(--secondary-orange);">+${(p.dailyReturn * p.duration * 100)}%</p>
                                </div>
                            </div>

                            <button class="btn btn-primary" style="width: 100%;" onclick="handleInvest('${p.id}')">Investir Agora</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `,

            wallet: () => `
            <div class="app-container animate-fade">
                <h1>Minha Carteira</h1>
                <p style="margin-bottom: 25px;">Gerencie seus depósitos e saques com segurança.</p>

                <!-- Wallet Hero -->
                <div class="glass-card" style="margin-bottom: 25px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,130,0,0.05));">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="background: var(--secondary-orange); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="fa-solid fa-wallet" style="color: white;"></i>
                        </div>
                        <div>
                            <p style="font-size: 0.85rem;">Saldo Disponível para Saque</p>
                            <h2 style="font-size: 2rem;">R$ ${State.user.available.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                    <button class="btn btn-outline" style="flex: 1; background: var(--glass-bg); padding: 8px;" id="btn-dep-tab" onclick="switchWalletTab('dep')">Depositar</button>
                    <button class="btn btn-outline" style="flex: 1; padding: 8px;" id="btn-trans-tab" onclick="switchWalletTab('trans')">Transferir</button>
                    <button class="btn btn-outline" style="flex: 1; padding: 8px;" id="btn-with-tab" onclick="switchWalletTab('with')">Sacar</button>
                </div>

                <!-- Deposit Section -->
                <div id="deposit-section" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Formas de Pagamento</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                        <button class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-color: var(--primary-blue);" onclick="selectPayMethod('pix')">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-brands fa-pix" style="color: #32BCAD; font-size: 1.4rem;"></i>
                                <span>PIX Instantâneo</span>
                            </div>
                            <i class="fa-solid fa-circle-check" style="color: var(--primary-blue);"></i>
                        </button>
                        <button class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;" onclick="selectPayMethod('usdt')">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <i class="fa-solid fa-coins" style="color: #26A17B; font-size: 1.4rem;"></i>
                                <span>USDT (TRC-20)</span>
                            </div>
                        </button>
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Valor do Depósito</label>
                    <input type="number" id="dep-amount" placeholder="Mínimo R$ 50,00" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-secondary" style="width: 100%;" onclick="handleDeposit()">Gerar Pagamento</button>
                </div>

                 <!-- Withdrawal Section (Hidden) -->
                <div id="withdraw-section" style="display: none;" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Solicitar Saque</h3>
                    <div class="alert" style="background: rgba(255,130,0,0.1); border: 1px solid var(--secondary-orange); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem;">
                        Saques são processados em até 24h úteis.
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Valor (R$)</label>
                    <input type="number" placeholder="Saldo: ${State.user.available.toFixed(2)}" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                    
                    <label style="display: block; margin-bottom: 8px;">Senha de Saque</label>
                    <input type="password" placeholder="Sua senha financeira" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-primary" style="width: 100%;">Confirmar Saque</button>
                </div>

                 <!-- Transfer Section (Hidden) -->
                <div id="transfer-section" style="display: none;" class="glass-card animate-fade">
                    <h3 style="margin-bottom: 20px;">Transferência Interna</h3>
                    <div class="alert" style="background: rgba(0,209,255,0.1); border: 1px solid var(--accent-blue); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem;">
                        Transfira saldo para outros usuários instantaneamente com taxa ZERO.
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px;">Telefone do Recebedor</label>
                    <input type="text" placeholder="(00) 00000-0000" id="trans-phone" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

                    <label style="display: block; margin-bottom: 8px;">Valor (R$)</label>
                    <input type="number" placeholder="Saldo: ${State.user.available.toFixed(2)}" id="trans-amount" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                    
                    <label style="display: block; margin-bottom: 8px;">Senha Financeira</label>
                    <input type="password" placeholder="Sua senha de segurança" id="trans-pass" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button class="btn btn-primary" style="width: 100%;" onclick="handleTransfer()">Realizar Transferência</button>
                </div>
            </div>
        `,

        pixCheckout: () => `
            <div class="app-container animate-fade" style="text-align: center; padding-top: 20px;">
                <h2 style="color: #4CAF50; margin-bottom: 10px;"><i class="fa-brands fa-pix"></i> PIX Gerado!</h2>
                <p>Pagamento Digital The Blue</p>
                
                <div class="glass-card" style="background: rgba(255,255,255,0.05); padding: 25px 15px; margin: 25px 0; border: 1px solid var(--primary-blue);">
                    <p style="font-size: 0.9rem; margin-bottom: 20px;">O valor a ser pago é: <strong style="font-size: 1.4rem; color: white;">R$ ${(State.currentPix ? State.currentPix.amount : 0).toFixed(2)}</strong></p>
                    
                    <div style="background: white; padding: 15px; border-radius: 12px; display: inline-block; margin-bottom: 25px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(State.currentPix ? State.currentPix.payload : '')}" alt="QR Code PIX" style="width: 200px; height: 200px;" />
                    </div>
                    
                    <p style="font-size: 0.8rem; margin-bottom: 8px;">Ou use o PIX Copia e Cola:</p>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" readonly value="${State.currentPix ? State.currentPix.payload : ''}" id="pix-copia-cola" style="flex: 1; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; color: #00d1ff; font-size: 0.6rem; text-align: center;">
                        <button class="btn btn-primary" onclick="window.copyPix()"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                
                <button class="btn btn-secondary" style="width: 100%; margin-bottom: 15px; padding: 15px;" onclick="Router.navigate('dashboard')">🔄 Já fiz o pagamento</button>
                <p style="font-size: 0.7rem; opacity: 0.6;">Aguarde alguns minutos após o pagamento para que a nossa equipe revise a transação.</p>
            </div>
        `,

            referral: () => `
            <div class="app-container animate-fade">
                <h1>Indique Amigos</h1>
                <p>Ganhe comissões multinível sobre os investimentos da sua rede.</p>

                <div class="glass-card" style="margin-top: 25px; margin-bottom: 25px; background: linear-gradient(to bottom right, var(--primary-dark), rgba(0,209,255,0.1));">
                    <p style="font-size: 0.8rem; margin-bottom: 10px;">Seu Link de Convite</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" readonly value="${window.location.origin}/ref/${State.user.phone}" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px dashed var(--glass-border); padding: 10px; border-radius: 8px; color: var(--accent-blue); font-size: 0.8rem;">
                        <button class="btn btn-outline" style="padding: 10px;" onclick="copyRef()"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px;">
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--primary-blue);">Nível 1</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">5%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--secondary-orange);">Nível 2</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">3%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: #607D8B;">Nível 3</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">2%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                </div>

                <div class="glass-card">
                    <h3 style="margin-bottom: 15px;">Meus Ganhos de Equipe</h3>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="color: #4CAF50;">R$ 0,00</h2>
                        <button class="btn btn-outline" style="font-size: 0.8rem;">Ver Ranking</button>
                    </div>
                </div>
            </div>
        `,

            admin: () => `
            <div class="app-container animate-fade">
                <h1>Painel Administrativo</h1>
                <p>Gestão global da plataforma "The Blue".</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <div class="glass-card" style="padding: 15px;">
                        <p style="font-size: 0.7rem;">Usuários Totais</p>
                        <h2 style="color: var(--primary-blue);">1.248</h2>
                    </div>
                    <div class="glass-card" style="padding: 15px;">
                        <p style="font-size: 0.7rem;">Depósitos Pendentes</p>
                        <h2 style="color: var(--secondary-orange);">12</h2>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>Aprovações Pendentes</h3>
                        <button class="btn btn-outline" style="padding: 5px; border-color: var(--primary-blue);" onclick="loadAdminData()"><i class="fa-solid fa-rotate-right"></i> Recarregar</button>
                    </div>
                    <div id="admin-pending-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Clique no botão recarregar para buscar Pix pendentes.</p>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Adicionar Saldo (Manual)</h3>
                    <div style="background: rgba(0,209,255,0.1); border: 1px solid var(--accent-blue); padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.8rem;">
                        Credite saldo diretamente na conta de um usuário.
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem;">Telefone do Cliente</label>
                    <input type="text" id="admin-add-phone" placeholder="(00) 00000-0000" class="input-field" style="width: 100%; padding: 10px; margin-bottom: 15px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem;">Valor a Creditar (R$)</label>
                    <input type="number" id="admin-add-amount" placeholder="50.00" class="input-field" style="width: 100%; padding: 10px; margin-bottom: 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">

                    <button class="btn btn-primary" style="width: 100%;" onclick="handleAddManualBalance()"><i class="fa-solid fa-plus-circle"></i> Confirmar Crédito</button>
                </div>
            </div>
        `,

            profile: () => `
            <div class="app-container animate-fade">
                <h1>Meu Perfil</h1>
                <p>Gerencie sua conta e configurações.</p>
                
                <div class="glass-card" style="margin-top: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <i class="fa-solid fa-user-ninja" style="color: var(--primary-blue); font-size: 2rem;"></i>
                    </div>
                    <h3>${State.user ? State.user.phone : ''}</h3>
                    <p style="font-size: 0.8rem; opacity: 0.6; margin-bottom: 20px;">Membro Especial "The Blue"</p>
                    
                    <button class="btn btn-outline" style="width: 100%; border-color: #00d1ff; color: #00d1ff; margin-bottom: 10px;" onclick="Router.navigate('admin')"><i class="fa-solid fa-shield-halved"></i> Acessar Painel Admin</button>

                    <button class="btn btn-outline" style="width: 100%; border-color: #FF5252; color: #FF5252;" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button>
                </div>
            </div>
        `
        },

        initAuthListeners() {
            // Here we could add specific event listeners if needed
        }
    };

    window.Router = Router;

    // --- Global Handlers (Exposed to HTML) ---

    window.toggleAuth = (showRegister) => {
        document.getElementById('register-fields').style.display = showRegister ? 'block' : 'none';
        document.getElementById('login-fields').style.display = showRegister ? 'none' : 'block';
    };

    window.handleRegister = async () => {
        const phone = document.getElementById('phone').value;
        const pass = document.getElementById('password').value;
        const withdrawPass = document.getElementById('withdraw_password').value;
        const sponsor = document.getElementById('sponsor').value;

        if (!phone || !pass || !withdrawPass) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (!supabase) {
            alert("Banco de dados ainda não configurado no app.js! Insira as chaves do Supabase.");
            return;
        }

        // Checar se o celular já existe enviando query
        let { data: existingUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (existingUser) {
            alert("Telefone já cadastrado!");
            return;
        }

        const newUser = {
            phone: phone,
            password: pass,
            withdraw_pass: withdrawPass,
            balance: 0,
            available: 0,
            invested: 0,
            sponsor: sponsor || null
        };

        const { error } = await supabase.from('users').insert([newUser]);
        if (error) { alert("Erro ao criar conta no banco!"); return; }

        State.user = newUser;
        State.transactions = [];
        Router.navigate('dashboard');
    };

    window.handleLogin = async () => {
        const phone = document.getElementById('login-phone').value;
        const pass = document.getElementById('login-password').value;

        if (!phone || !pass) {
            alert("Por favor, preencha os campos.");
            return;
        }

        if (!supabase) { alert("Banco de dados ausente."); return; }

        const { data: user, error } = await supabase.from('users').select('*').eq('phone', phone).single();

        if (error || !user || user.password !== pass) {
            alert("Credenciais inválidas ou conta não encontrada.");
            return;
        }

        // Carregar transações do histórico real
        const { data: txs } = await supabase.from('transactions')
            .select('*')
            .eq('user_phone', phone)
            .order('created_at', { ascending: false });

        State.user = user;

        // Mapear datas do banco para formato local visual temporário
        State.transactions = (txs || []).map(t => ({
            ...t,
            date: new Date(t.created_at).toLocaleDateString('pt-BR')
        }));

        Router.navigate('dashboard');
    };

    window.currentPayMethod = 'pix';
    window.selectPayMethod = (method) => {
        window.currentPayMethod = method;
        alert(`Método selecionado: ${method.toUpperCase()}`);
    };

    window.handleDeposit = async () => {
        const amount = parseFloat(document.getElementById('dep-amount').value);
        if (!amount || amount < 50) {
            alert("O valor mínimo de depósito é R$ 50,00.");
            return;
        }

        if (window.currentPayMethod !== 'pix') {
            alert("No momento, apenas PIX está liberado automaticamente.");
            return;
        }

        const pixKey = "theblue-pagamentos@gmail.com";
        const payload = window.generatePixPayload(pixKey, "The Blue Plataforma", "Sao Paulo", amount);
        
        State.currentPix = { amount: amount, payload: payload };

        const tx = {
            user_phone: State.user.phone,
            type: 'pix_pendente',
            amount: amount,
            description: 'Depósito PIX (Aguardando)'
        };

        const { error } = await supabase.from('transactions').insert([tx]);
        if (error) {
            alert("Erro ao registrar intenção de depósito.");
            return;
        }

        tx.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(tx);
        
        Router.navigate('pix_checkout');
    };

    window.copyPix = () => {
        const input = document.getElementById('pix-copia-cola');
        input.select();
        document.execCommand('copy');
        alert('Código PIX Copia e Cola copiado com sucesso! Abra o app do seu banco e cole na área PIX.');
    };

    window.generatePixPayload = (chave, nome, cidade, valor) => {
        const pad = (n, len) => n.toString().padStart(len, '0');
        let payloadString = "000201010212";
        let gui = "0014br.gov.bcb.pix";
        let key = "01" + pad(chave.length, 2) + chave;
        let accInfo = gui + key;
        payloadString += "26" + pad(accInfo.length, 2) + accInfo;
        payloadString += "520400005303986";
        if (valor > 0) {
            let valStr = valor.toFixed(2);
            payloadString += "54" + pad(valStr.length, 2) + valStr;
        }
        payloadString += "5802BR59" + pad(nome.length, 2) + nome + "60" + pad(cidade.length, 2) + cidade;
        let addData = "0503***";
        payloadString += "62" + pad(addData.length, 2) + addData + "6304";
        
        // CRC16 Checksum
        let poly = 0x1021, res = 0xFFFF;
        for (let i = 0; i < payloadString.length; i++) {
            res ^= (payloadString.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((res & 0x8000) !== 0) res = (res << 1) ^ poly;
                else res = (res << 1);
            }
        }
        res &= 0xFFFF;
        return payloadString + res.toString(16).toUpperCase().padStart(4, '0');
    };

    window.switchWalletTab = (tab) => {
        const depSec = document.getElementById('deposit-section');
        const withSec = document.getElementById('withdraw-section');
        const transSec = document.getElementById('transfer-section');
        const btnDep = document.getElementById('btn-dep-tab');
        const btnWith = document.getElementById('btn-with-tab');
        const btnTrans = document.getElementById('btn-trans-tab');

        depSec.style.display = tab === 'dep' ? 'block' : 'none';
        withSec.style.display = tab === 'with' ? 'block' : 'none';
        transSec.style.display = tab === 'trans' ? 'block' : 'none';

        btnDep.style.background = tab === 'dep' ? 'var(--glass-bg)' : 'transparent';
        btnWith.style.background = tab === 'with' ? 'var(--glass-bg)' : 'transparent';
        btnTrans.style.background = tab === 'trans' ? 'var(--glass-bg)' : 'transparent';
    };

    window.handleTransfer = async () => {
        const phone = document.getElementById('trans-phone').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const pass = document.getElementById('trans-pass').value;

        if (!phone || !amount || !pass) {
            alert("Preencha todos os campos para transferir.");
            return;
        }

        if (pass !== State.user.withdraw_pass) {
            alert("Senha financeira incorreta.");
            return;
        }

        if (amount <= 0 || amount > State.user.available) {
            alert("Valor inválido ou saldo insuficiente.");
            return;
        }

        // Integracao Banco
        const { data: destUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (!destUser) {
            alert("O telefone informado não foi localizado no sistema.");
            return;
        }

        // Alterando balanços via DB Call
        State.user.available -= amount;
        State.user.balance -= amount;
        destUser.available += amount;
        destUser.balance += amount;

        await supabase.from('users').update({ available: State.user.available, balance: State.user.balance }).eq('phone', State.user.phone);
        await supabase.from('users').update({ available: destUser.available, balance: destUser.balance }).eq('phone', destUser.phone);

        // Registrando hist de transaçoes entre os dois
        const txOut = { user_phone: State.user.phone, type: 'with', amount: -amount, description: `Transf. para ${phone}` };
        const txIn = { user_phone: phone, type: 'dep', amount: amount, description: `Transf. recebida de ${State.user.phone}` };

        await supabase.from('transactions').insert([txOut, txIn]);

        txOut.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(txOut);

        alert(`Transferência de R$ ${amount.toFixed(2)} para ${phone} concluída via banco real!`);
        Router.navigate('wallet');
    };

    window.handleInvest = async (planId) => {
        const plan = State.plans.find(p => p.id === planId);
        if (!State.user || State.user.available < plan.min) {
            alert("Saldo disponível insuficiente. Faça um depósito!");
            Router.navigate('wallet');
            return;
        }

        // Modal or input prompt for amount
        const amount = prompt(`Quanto deseja investir no ${plan.name}?\n(Mín: R$${plan.min} | Máx: R$${plan.max})`, plan.min);

        if (amount && amount >= plan.min && amount <= plan.max) {
            State.user.available -= parseFloat(amount);
            State.user.invested += parseFloat(amount);

            await supabase.from('users').update({ available: State.user.available, invested: State.user.invested }).eq('phone', State.user.phone);

            const txInv = { user_phone: State.user.phone, type: 'inv', amount: -parseFloat(amount), description: `Investimento: ${plan.name}` };
            await supabase.from('transactions').insert([txInv]);

            txInv.date = new Date().toLocaleDateString('pt-BR');
            State.transactions.unshift(txInv);

            alert("Investimento registrado no banco com sucesso!");
            Router.navigate('dashboard');
        }
    };

    window.handleAddManualBalance = async () => {
        const phone = document.getElementById('admin-add-phone').value;
        const amount = parseFloat(document.getElementById('admin-add-amount').value);

        if (!phone || !amount || amount <= 0) {
            alert("Preencha o telefone e um valor válido.");
            return;
        }

        if (!supabase) {
            alert("Supabase não configurado. Adicione suas chaves no app.js.");
            return;
        }

        // Buscar o usuário
        const { data: destUser } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (!destUser) {
            alert("O telefone informado não foi localizado na base de dados (Supabase).");
            return;
        }

        // Injetar os fundos (Atualiza Available e Balance)
        const newAvailable = Number(destUser.available) + amount;
        const newBalance = Number(destUser.balance) + amount;

        const { error: updateError } = await supabase.from('users').update({
            available: newAvailable,
            balance: newBalance
        }).eq('phone', phone);

        if (updateError) {
            alert("Erro de banco de dados ao atualizar saldo.");
            return;
        }

        // Registrar como Depósito Aprovado para o destinatário ver no Extrato
        const tx = {
            user_phone: phone,
            type: 'dep',
            amount: amount,
            description: 'Depósito Aprovado (Aporte)'
        };
        await supabase.from('transactions').insert([tx]);

        alert(`Sucesso! Saldo de R$ ${amount.toFixed(2)} foi creditado para o usuário ${phone}.`);

        // Limpar os campos pós-sucesso
        document.getElementById('admin-add-phone').value = '';
        document.getElementById('admin-add-amount').value = '';
    };

    window.loadAdminData = async () => {
        const list = document.getElementById('admin-pending-list');
        list.innerHTML = '<p style="text-align: center;">Buscando Pix...</p>';

        const { data: pendings } = await supabase.from('transactions')
            .select('*')
            .eq('type', 'pix_pendente')
            .order('created_at', { ascending: false });

        if (!pendings || pendings.length === 0) {
            list.innerHTML = '<p style="text-align: center; opacity: 0.5;">Nenhum depósito pendente.</p>';
            return;
        }

        list.innerHTML = pendings.map(p => `
            <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 15px;">
                 <p style="font-size: 0.85rem; font-weight: 600;">Depósito PIX: <span style="color: #4CAF50;">R$ ${p.amount.toFixed(2)}</span></p>
                 <p style="font-size: 0.7rem; opacity: 0.6; margin-bottom: 10px;">Cliente: ${p.user_phone} | ID: ${p.id.split('-')[0]}</p>
                 <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="padding: 5px 15px; font-size: 0.7rem; flex: 1;" onclick="approvePix('${p.id}', '${p.user_phone}', ${p.amount})">✔ Aprovar PIX</button>
                    <button class="btn btn-outline" style="padding: 5px 15px; font-size: 0.7rem; color: #FF5252; flex: 1;" onclick="rejectPix('${p.id}')">❌ Recusar</button>
                 </div>
            </div>
        `).join('');
    };

    window.approvePix = async (txId, phone, amount) => {
        if(!confirm(`Aprovar e creditar o saldo de R$ ${amount.toFixed(2)} na conta ${phone}?`)) return;

        const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
        if(user) {
            await supabase.from('users').update({
                available: Number(user.available) + amount,
                balance: Number(user.balance) + amount
            }).eq('phone', phone);
            
            await supabase.from('transactions').update({
                type: 'dep',
                description: 'Depósito PIX (Aprovado)'
            }).eq('id', txId);

            alert("Sucesso! O PIX foi aprovado e o saldo está na conta do cliente.");
            loadAdminData();
        }
    };

    window.rejectPix = async (txId) => {
        if(!confirm("Tem certeza que esse depósito é inválido/falso? Ele será marcado como Recusado.")) return;
        await supabase.from('transactions').update({
            type: 'pix_recusado',
            description: 'Depósito PIX (Recusado)'
        }).eq('id', txId);
        loadAdminData();
    };

    window.copyRef = () => {
        const input = document.querySelector('input[readonly]');
        input.select();
        document.execCommand('copy');
        alert('Link de convite copiado!');
    };

    window.handleLogout = () => {
        State.user = null;
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab-item[data-view="dashboard"]').classList.add('active'); // Reset tab state
        Router.navigate('auth');
    };

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        // Check if there's a referral code in the URL
        const path = window.location.pathname;
        if (path.startsWith('/ref/')) {
            const refCode = path.replace('/ref/', '');
            if (refCode) {
                localStorage.setItem('theblue_ref', refCode);
                window.history.replaceState({}, document.title, "/");
                State.currentView = 'auth';
                setTimeout(() => {
                    if (window.toggleAuth) window.toggleAuth(true);
                }, 100);
            }
        }

        // Setup Navigation Listeners
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.getAttribute('data-view');

                // Mark active tab
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');

                Router.navigate(view);
            });
        });

        // Start App
        Router.render();
    });
})();
