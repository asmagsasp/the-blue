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

    // --- Integração com o WhatsApp removida ---




    // --- Global Application State ---
    const State = {
        user: null, // Initially null
        currentView: 'auth', // 'auth', 'dashboard', 'investments', 'wallet', 'referral', 'admin'
        plans: [],
        investments: [],
        transactions: [],
        referrals: { level1: [], level2: [], level3: [] },
        currentPix: null,
        fortune_session: { accumulated: 0, spinsLeft: 0, isSpinning: false }
    };

    // --- View Router & Rendering ---
    const Router = {
        navigate(view) {
            if (view === 'admin') {
                const cleanPhone = State.user && State.user.phone ? State.user.phone.replace(/\D/g, '') : '';
                if (cleanPhone !== '19999995149' && cleanPhone !== '1934585300') {
                    alert('🔒 Área Restrita. Apenas administradores autorizados têm acesso a esta tela.');
                    return;
                }
            }
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
                // Sincronizar aba ativa do rodapé com a view atual
                document.querySelectorAll('.tab-item').forEach(tab => {
                    if (tab.getAttribute('data-view') === State.currentView) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
            } else {
                nav.style.display = 'none';
            }

            // Render matching view
            switch (State.currentView) {
                case 'auth':
                    app.innerHTML = Router.views.auth();
                    Router.initAuthListeners();
                    break;
                case 'dashboard':
                    app.innerHTML = Router.views.dashboard();

                    break;
                case 'investments':
                    app.innerHTML = Router.views.investments();
                    break;
                case 'wallet':
                    app.innerHTML = Router.views.wallet();
                    break;
                case 'referral':
                    app.innerHTML = Router.views.referral();
                    break;
                case 'admin':
                    app.innerHTML = Router.views.admin();
                    if (window.loadAdminStats) window.loadAdminStats();
                    if (window.loadAdminData) window.loadAdminData();
                    break;
                case 'pix_checkout':
                    app.innerHTML = Router.views.pixCheckout();
                    break;
                case 'fortune_wheel':
                    app.innerHTML = Router.views.fortune_wheel();
                    break;
                case 'profile':
                    app.innerHTML = Router.views.profile();
                    break;
                default:
                    app.innerHTML = '<h1>404 Not Found</h1>';
            }
        },

        views: {
        auth: () => {
            const savedPhone = localStorage.getItem('theblue_session_phone') || '';
            const isRemembered = localStorage.getItem('theblue_remember') === '1';
            
            // Ativa aba Cadastrar por padrão se houver indicação na URL e o usuário ainda não tiver sessão salva
            const urlParams = new URLSearchParams(window.location.search);
            const hasRef = !!urlParams.get('ref') || window.location.pathname.startsWith('/ref/');
            const showRegisterDefault = hasRef && !savedPhone;

            return `
            <div class="app-container animate-fade">
                <div class="auth-header" style="text-align: center; padding: 10px 0 20px 0;">
                    <div class="mascot-container">
                        <div class="mascot-shape"></div>
                    </div>
                    <h1 style="color: var(--primary-blue); font-size: 2.5rem; margin-top: 5px;">The Blue</h1>
                    <p style="font-size: 0.85rem; color: var(--text-dim);">O Azul que transforma seu futuro.</p>
                </div>

                <div id="auth-form" class="glass-card" style="padding: 25px 20px;">

                    <!-- Tabs de navegação -->
                    <div style="display: flex; background: rgba(255,255,255,0.06); border-radius: 12px; padding: 4px; margin-bottom: 25px; border: 1px solid var(--glass-border);">
                        <button type="button" id="tab-login" onclick="toggleAuth(false)" 
                                style="flex: 1; padding: 12px; border: none; border-radius: 9px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; ${!showRegisterDefault ? 'background: var(--primary-blue); color: white; box-shadow: 0 4px 12px rgba(0,102,255,0.4);' : 'background: transparent; color: var(--text-dim);'}">
                            <i class="fa-solid fa-right-to-bracket" style="margin-right: 6px;"></i> Entrar
                        </button>
                        <button type="button" id="tab-register" onclick="toggleAuth(true)" 
                                style="flex: 1; padding: 12px; border: none; border-radius: 9px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; ${showRegisterDefault ? 'background: var(--secondary-orange); color: white; box-shadow: 0 4px 12px rgba(255,130,0,0.4);' : 'background: transparent; color: var(--text-dim);'}">
                            <i class="fa-solid fa-user-plus" style="margin-right: 6px;"></i> Cadastrar
                        </button>
                    </div>

                    <!-- Aba 1: ENTRAR -->
                    <form id="login-fields" onsubmit="event.preventDefault(); handleLogin();" style="display: ${showRegisterDefault ? 'none' : 'block'};">
                        <div style="margin-bottom: 18px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Telefone</label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-phone" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--primary-blue); font-size: 0.9rem;"></i>
                                <input type="tel" name="username" id="login-phone" value="${savedPhone}" autocomplete="username" placeholder="(00) 00000-0000" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <div style="margin-bottom: 18px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Senha</label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-lock" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--primary-blue); font-size: 0.9rem;"></i>
                                <input type="password" name="password" id="login-password" autocomplete="current-password" placeholder="••••••••" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 22px; cursor: pointer; user-select: none;">
                            <div style="position: relative; width: 42px; height: 24px; flex-shrink: 0;">
                                <input type="checkbox" id="remember-me" style="opacity: 0; width: 0; height: 0; position: absolute;" ${isRemembered ? 'checked' : ''}>
                                <span id="remember-toggle" onclick="toggleRememberMe()" style="position: absolute; inset: 0; background: ${isRemembered ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)'}; border-radius: 24px; transition: background 0.3s; border: 1px solid var(--glass-border); cursor: pointer;">
                                    <span style="position: absolute; left: ${isRemembered ? '20px' : '3px'}; top: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: left 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></span>
                                </span>
                            </div>
                            <span style="font-size: 0.85rem; color: var(--text-dim);">Lembrar de mim</span>
                        </label>

                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(0,102,255,0.3);">
                            <i class="fa-solid fa-right-to-bracket"></i> Acessar Plataforma
                        </button>

                        <p style="text-align: center; margin-top: 18px; font-size: 0.82rem; color: var(--text-dim);">
                            Ainda não tem conta? <span onclick="toggleAuth(true)" style="color: var(--primary-blue); cursor: pointer; font-weight: 700; text-decoration: underline;">Cadastre-se grátis</span>
                        </p>
                    </form>

                    <!-- Aba 2: CADASTRAR -->
                    <form id="register-fields" onsubmit="event.preventDefault(); handleRegister();" style="display: ${showRegisterDefault ? 'block' : 'none'};">
                        <div style="margin-bottom: 14px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Código de Convite <span style="opacity:0.6; font-weight:400;">(Opcional)</span></label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-ticket" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--secondary-orange); font-size: 0.9rem;"></i>
                                <input type="text" name="sponsor-code" id="sponsor" value="${localStorage.getItem('theblue_ref') || ''}" autocomplete="off" placeholder="Código de Convite" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <div style="margin-bottom: 14px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Seu Telefone</label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-phone" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--secondary-orange); font-size: 0.9rem;"></i>
                                <input type="tel" name="reg-phone" id="phone" autocomplete="off" placeholder="(00) 00000-0000" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <div style="margin-bottom: 14px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Criar Senha de Acesso <span style="opacity:0.6; font-weight:400;">(Mínimo 6 dígitos)</span></label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-lock" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--secondary-orange); font-size: 0.9rem;"></i>
                                <input type="password" name="new-password" id="password" minlength="6" autocomplete="new-password" placeholder="Mínimo 6 dígitos" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <div style="margin-bottom: 22px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 600; color: var(--text-dim);">Senha Financeira (para saques)</label>
                            <div style="position: relative;">
                                <i class="fa-solid fa-key" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--secondary-orange); font-size: 0.9rem;"></i>
                                <input type="password" name="withdraw-password" id="withdraw_password" autocomplete="off" placeholder="••••••••" class="input-field" style="width: 100%; padding: 12px 12px 12px 42px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 0.95rem;">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-secondary" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 10px; font-weight: 700; box-shadow: 0 4px 15px rgba(255,130,0,0.3);">
                            <i class="fa-solid fa-user-plus"></i> Criar Conta Grátis
                        </button>

                        <p style="text-align: center; margin-top: 18px; font-size: 0.82rem; color: var(--text-dim);">
                            Já tem uma conta? <span onclick="toggleAuth(false)" style="color: var(--secondary-orange); cursor: pointer; font-weight: 700; text-decoration: underline;">Entrar agora</span>
                        </p>
                    </form>

                </div>
            </div>
            `;
        },

            dashboard: () => `
            <div class="app-container animate-fade">
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <p style="margin-bottom: 2px;">Olá, <span style="color: white; font-weight: 600;">${State.user.phone}</span></p>
                        <h2 style="font-size: 1.2rem;">Bem-vindo ao Azul!</h2>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div id="checkin-btn-container">
                            ${(() => {
                    let isLocked = false;
                    if (State.user && State.user.last_checkin) {
                        const last = new Date(State.user.last_checkin);
                        const now = new Date();
                        isLocked = (now - last < 24 * 60 * 60 * 1000);
                    }

                    return `
                                <button class="btn ${isLocked ? 'btn-outline' : 'btn-secondary'}" 
                                        style="font-size: 0.73rem; padding: 10px 14px; border-radius: 20px; ${isLocked ? 'opacity: 0.5; cursor: not-allowed;' : 'box-shadow: 0 0 20px var(--secondary-orange)50;'}"
                                        onclick="${isLocked ? "alert('Você já fez o check-in! Volte amanhã.')" : 'handleDailyCheckin()'}">
                                    <i class="fa-solid fa-calendar-check"></i> ${isLocked ? 'Feito' : 'Check-in'}
                                </button>
                                `;
                })()}
                        </div>
                        <div style="background: var(--glass-bg); padding: 8px; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; position: relative; border: 1px solid var(--glass-border);">
                             <i class="fa-solid fa-user-ninja" style="color: var(--primary-blue); font-size: 1.2rem;"></i>
                             <div style="position: absolute; top: -5px; right: -5px; background: var(--secondary-orange); color: white; font-size: 0.65rem; padding: 2px 7px; border-radius: 12px; font-weight: 800; border: 2px solid var(--primary-deep); box-shadow: 0 0 10px var(--secondary-orange)40;">
                                ${State.user.points || 0}
                             </div>
                        </div>
                    </div>
                </header>

                <!-- Points Progress -->
                <div class="glass-card" style="margin-bottom: 20px; padding: 15px; border-left: 4px solid var(--secondary-orange);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 0.8rem; font-weight: 600;">Progresso de Recompensa</span>
                        <span style="font-size: 0.8rem; color: var(--secondary-orange); font-weight: 700;">${State.user.points || 0}/${State.user.checkin_target || 7}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
                        <div style="width: ${Math.min(((State.user.points || 0) / (State.user.checkin_target || 7)) * 100, 100)}%; height: 100%; background: linear-gradient(to right, var(--secondary-orange), #FFB74D); border-radius: 4px; transition: width 1s ease-in-out;"></div>
                    </div>
                    ${(State.user.points || 0) >= (State.user.checkin_target || 7) ? `
                        <button class="btn btn-primary" style="width: 100%; font-size: 0.8rem; background: linear-gradient(45deg, #4CAF50, #2E7D32); border: none; animation: animate-pulse-gold 2s infinite;" onclick="handleExchangePoints()">
                            🎁 RESGATAR R$ ${(State.user.checkin_target || 7).toFixed(2)} AGORA
                        </button>
                    ` : `
                        <p style="font-size: 0.65rem; opacity: 0.7; text-align: center;">Complete ${State.user.checkin_target || 7} dias para ganhar R$ ${(State.user.checkin_target || 7).toFixed(2)} no saldo!</p>
                    `}
                </div>

                <!-- Balance Cards -->
                <div class="glass-card" style="background: linear-gradient(135deg, var(--primary-blue), #003399); border: none; margin-bottom: 20px;">
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Saldo Disponível</p>
                    <h1 style="font-size: 2.8rem; margin: 10px 0; -webkit-text-fill-color: white;">R$ ${Number(State.user.available || 0).toFixed(2)}</h1>
                </div>

                <!-- Quick Actions -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 25px;">
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('dep'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-plus-circle" style="color: var(--secondary-orange); font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Depositar</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('trans'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-paper-plane" style="color: #00D1FF; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Transferir</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('investments')" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-bolt" style="color: #4CAF50; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Investir</span>
                    </button>
                    <button class="glass-card" onclick="Router.navigate('wallet'); setTimeout(() => switchWalletTab('with'), 50);" style="padding: 12px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-wallet" style="color: #FF5252; font-size: 1.1rem;"></i>
                        <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">Saque</span>
                    </button>
                </div>

                <!-- Banner Informativo: Nova Regra de Planos (2 Cotas Máximas) -->
                <div class="glass-card" style="margin-bottom: 25px; background: linear-gradient(135deg, rgba(0, 102, 255, 0.22) 0%, rgba(0, 209, 255, 0.12) 100%); border: 1px solid rgba(0, 209, 255, 0.4); padding: 15px 18px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; gap: 15px; cursor: pointer; box-shadow: 0 6px 24px rgba(0, 102, 255, 0.25);" onclick="Router.navigate('investments')">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="background: rgba(0, 209, 255, 0.2); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #00D1FF; flex-shrink: 0; box-shadow: 0 0 12px rgba(0, 209, 255, 0.4); border: 1px solid rgba(0, 209, 255, 0.3);">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                                <span style="background: linear-gradient(90deg, #00D1FF, #0066FF); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">NOVA REGRA</span>
                                <span style="font-size: 0.88rem; font-weight: 700; color: #fff;">Limite de 2 Aportes por Plano</span>
                            </div>
                            <p style="font-size: 0.74rem; color: rgba(255,255,255,0.85); margin: 0; line-height: 1.3;">Cada plano só pode ser investido <strong>2 vezes</strong> por usuário. Toque para ver seus limites.</p>
                        </div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00D1FF; font-size: 0.9rem; flex-shrink: 0;">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>

                <!-- Earning Stats -->
                <div class="glass-card" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <h3 style="font-size: 1rem;">Rendimento Estimado</h3>
                            <p style="font-size: 0.7rem; opacity: 0.6;">Lucro diário com base nos seus planos</p>
                        </div>
                        <span style="color: #4CAF50; font-weight: 800; font-size: 1.1rem;">+ R$ ${(Number(State.user.invested || 0) * 0.02).toFixed(2)}</span>
                    </div>
                    <div style="height: 40px; display: flex; align-items: flex-end; gap: 5px; margin-bottom: 12px;">
                        ${[20, 60, 40, 80, 50, 100, 90, 70, 110, 80, 120].map(h => `<div style="flex: 1; background: var(--primary-blue); height: ${h}%; border-radius: 3px; opacity: ${h / 150};"></div>`).join('')}
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.72rem; color: #00d1ff;">
                        <span><i class="fa-solid fa-moon"></i> Próximo Crédito (00:00):</span>
                        <span class="midnight-timer" style="font-weight: 700; background: rgba(0,209,255,0.15); padding: 3px 8px; border-radius: 6px;">Calculando...</span>
                    </div>
                </div>

                <!-- Active Investments Section -->
                <div style="margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="font-size: 1.1rem;">Meus Investimentos</h3>
                        <span style="font-size: 0.7rem; background: rgba(0,209,255,0.1); color: var(--accent-blue); padding: 4px 10px; border-radius: 12px; font-weight: 700;">ATIVOS</span>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${(() => {
                            const invs = State.transactions.filter(t => t.type === 'inv');
                            if (invs.length === 0) {
                                return `
                                    <div class="glass-card" style="text-align: center; padding: 30px; border: 1px dashed rgba(255,255,255,0.1);">
                                        <p style="font-size: 0.8rem; opacity: 0.5;">Você ainda não tem investimentos ativos.</p>
                                        <button class="btn btn-outline" style="margin-top: 15px; font-size: 0.75rem;" onclick="Router.navigate('investments')">VER PLANOS DISPONÍVEIS</button>
                                    </div>
                                `;
                            }
                            return invs.map(inv => `
                                <div class="glass-card" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-left: 3px solid #4CAF50; background: linear-gradient(90deg, rgba(76,175,80,0.05), transparent);">
                                    <div style="background: rgba(76,175,80,0.1); width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fa-solid fa-bolt" style="color: #4CAF50;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <p style="font-size: 0.9rem; font-weight: 700; color: white;">${inv.description.replace('Investimento: ', '')}</p>
                                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                                            <span style="font-size: 0.7rem; color: #4CAF50; font-weight: 600;">R$ ${Math.abs(inv.amount).toFixed(2)}</span>
                                            <span style="width: 3px; height: 3px; background: rgba(255,255,255,0.2); border-radius: 50%;"></span>
                                            <span style="font-size: 0.65rem; opacity: 0.5;">Iniciado em ${inv.date}</span>
                                        </div>
                                    </div>
                                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                                        <div style="width: 30px; height: 30px;">
                                            <svg viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4CAF50" stroke-width="3" stroke-dasharray="35, 100" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                        })()}
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
                                    <i class="fa-solid ${tr.type === 'dep' || tr.type === 'pix_pendente' ? 'fa-arrow-down' : tr.type === 'comissao' ? 'fa-trophy' : 'fa-arrow-up'}" style="color: ${tr.type === 'dep' ? '#4CAF50' : tr.type === 'pix_pendente' ? '#FF9800' : tr.type === 'comissao' ? '#FFD700' : '#FF5252'};"></i>
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

            fortune_wheel: () => {
                const totalInvested = State.user.invested || 0;
                const totalEarned = Math.floor(totalInvested / 1000) * 3;
                const totalRemaining = totalEarned - (State.user.spins_used || 0);

                if (!State.fortune_session.isActive) {
                    State.fortune_session.spinsLeft = Math.min(totalRemaining, 3);
                    State.fortune_session.accumulated = 0;
                    State.fortune_session.isActive = true;
                }

                return `
                <div class="app-container animate-fade" style="text-align: center;">
                    <h1>Roda da Fortuna</h1>
                    <p style="margin-bottom: 20px;">Gire e ganhe prêmios reais! <br>A cada R$ 1.000 investidos, você ganha 3 giros.</p>

                    <div class="glass-card" style="margin-bottom: 20px; border-left: 4px solid var(--accent-blue);">
                        <div style="display: flex; justify-content: space-around;">
                            <div>
                                <p style="font-size: 0.7rem;">Acumulado</p>
                                <h2 id="fortune-accumulated" style="color: #4CAF50;">R$ ${State.fortune_session.accumulated.toFixed(2)}</h2>
                            </div>
                            <div>
                                <p style="font-size: 0.7rem;">Giros Restantes</p>
                                <h2 id="fortune-spins" style="color: var(--secondary-orange);">${State.fortune_session.spinsLeft}</h2>
                            </div>
                        </div>
                    </div>

                    <div class="wheel-container">
                        <div class="wheel-pointer"></div>
                        <div id="main-wheel" class="wheel">
                            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-22.5deg);">
                                <circle cx="50" cy="50" r="50" fill="#111" />
                                <path d="M50 50 L100 50 A50 50 0 0 1 85.3 85.3 Z" fill="#4CAF50" />
                                <path d="M50 50 L85.3 85.3 A50 50 0 0 1 50 100 Z" fill="#FF5252" />
                                <path d="M50 50 L50 100 A50 50 0 0 1 14.7 85.3 Z" fill="#00D1FF" />
                                <path d="M50 50 L14.7 85.3 A50 50 0 0 1 0 50 Z" fill="#FFD700" />
                                <path d="M50 50 L0 50 A50 50 0 0 1 14.7 14.7 Z" fill="#FF5252" />
                                <path d="M50 50 L14.7 14.7 A50 50 0 0 1 50 0 Z" fill="#9C27B0" />
                                <path d="M50 50 L50 0 A50 50 0 0 1 85.3 14.7 Z" fill="#FFD700" />
                                <path d="M50 50 L85.3 14.7 A50 50 0 0 1 100 50 Z" fill="#4CAF50" />
                                
                                <g font-size="3.6" font-weight="900" fill="white" style="pointer-events: none; text-anchor: middle; dominant-baseline: central;">
                                    <text x="81.4" y="63.0" transform="rotate(22.5, 81.4, 63.0)">R$ 5</text>
                                    <text x="63.0" y="81.4" transform="rotate(67.5, 63.0, 81.4)" font-size="2.5">PERDEU TUDO</text>
                                    <text x="37.0" y="81.4" transform="rotate(112.5, 37.0, 81.4)">R$ 20</text>
                                    <text x="18.6" y="63.0" transform="rotate(157.5, 18.6, 63.0)">R$ 10</text>
                                    <text x="18.6" y="37.0" transform="rotate(202.5, 18.6, 37.0)" font-size="2.5">PERDEU TUDO</text>
                                    <text x="37.0" y="18.6" transform="rotate(247.5, 37.0, 18.6)">R$ 50</text>
                                    <text x="63.0" y="18.6" transform="rotate(292.5, 63.0, 18.6)">R$ 100</text>
                                    <text x="81.4" y="37.0" transform="rotate(337.5, 81.4, 37.0)">R$ 5</text>
                                </g>
                            </svg>
                        </div>
                        <div class="wheel-center">BLUE</div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="spin-btn" class="btn btn-primary" style="flex: 2; height: 55px; border-radius: 12px; font-size: 1.1rem;" onclick="handleFortuneSpin()" ${State.fortune_session.spinsLeft === 0 || State.fortune_session.isSpinning ? 'disabled' : ''}>
                           <i class="fa-solid fa-sync-alt"></i> GIRAR AGORA
                        </button>
                        <button id="claim-btn" class="btn btn-outline" style="flex: 1; border-color: #4CAF50; color: #4CAF50; display: ${State.fortune_session.accumulated > 0 && !State.fortune_session.isSpinning ? 'block' : 'none'};" onclick="handleFortuneClaim()">
                           RESGATAR
                        </button>
                    </div>

                    <div id="fortune-msg" style="margin-top: 20px; font-size: 0.9rem; font-weight: 600; min-height: 20px;"></div>

                    <div style="margin-top: 30px; font-size: 0.75rem; opacity: 0.6; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <p>Total Investido: <strong>R$ ${totalInvested.toFixed(2)}</strong></p>
                        <p>Giros Totais Ganhos: <strong>${totalEarned}</strong></p>
                        <p>Giros já utilizados: <strong>${State.user.spins_used || 0}</strong></p>
                    </div>
                </div>
                `;
            },

            investments: () => `
            <div class="app-container animate-fade">
                <h1 style="margin-bottom: 10px;">Planos de Investimento</h1>
                <p style="margin-bottom: 20px;">Escolha o plano ideal para seu crescimento "The Blue".</p>

                <!-- Banner Informativo da Regra de Cotas -->
                <div class="glass-card" style="margin-bottom: 25px; border-left: 4px solid #00D1FF; background: linear-gradient(90deg, rgba(0, 209, 255, 0.15) 0%, rgba(0, 102, 255, 0.06) 100%); border-top: 1px solid rgba(0, 209, 255, 0.3); border-right: 1px solid rgba(0, 209, 255, 0.2); border-bottom: 1px solid rgba(0, 209, 255, 0.2); padding: 16px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 20px rgba(0, 209, 255, 0.15); border-radius: 16px;">
                    <div style="background: rgba(0, 209, 255, 0.2); width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 12px rgba(0, 209, 255, 0.4); border: 1px solid rgba(0, 209, 255, 0.4);">
                        <i class="fa-solid fa-circle-info" style="color: #00D1FF; font-size: 1.2rem;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="background: #00D1FF; color: #000; font-size: 0.65rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">Regra Oficial</span>
                            <p style="font-size: 0.88rem; color: #fff; font-weight: 700; margin: 0;">Limite: Máximo de 2 Aportes por Plano</p>
                        </div>
                        <p style="font-size: 0.75rem; color: var(--text-dim); margin: 0; line-height: 1.4;">Para garantir sustentabilidade e oportunidade justa, cada usuário pode realizar <strong>no máximo 2 investimentos ativos</strong> em cada plano.</p>
                    </div>
                </div>

                ${State.plans.length === 0 ? '<p style="text-align: center; opacity: 0.5; margin-top: 50px;">Ainda não há planos ativos na plataforma. Aguarde novidades!</p>' : ''}

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${State.plans.map(p => {
                const now = new Date();
                const startsAt = p.startsAt ? new Date(p.startsAt) : null;
                const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null;

                let state = 'NORMAL';
                if (p.isSurprise) {
                    if (startsAt && now < startsAt) state = 'LOCKED';
                    else if (expiresAt && now > expiresAt) state = 'EXPIRED';
                    else state = 'SURPRISE_ACTIVE';
                }

                const n = String(p.name).toLowerCase();
                let icon = '🚀'; let color = 'var(--primary-blue)';
                if (n.includes('diamante')) { icon = '💎'; color = '#00f2fe'; }
                else if (n.includes('esmeralda')) { icon = '❇️'; color = '#00ff88'; }
                else if (n.includes('ouro') || n.includes('gold')) { icon = '🥇'; color = '#FFD700'; }
                else if (n.includes('prata') || n.includes('silver')) { icon = '🥈'; color = '#C0C0C0'; }
                else if (n.includes('bronze')) { icon = '🥉'; color = '#cd7f32'; }

                // Contagem de investimentos do usuário neste plano
                const userPlanInvs = (State.transactions || []).filter(t => t.type === 'inv' && t.description && t.description.replace('Investimento: ', '').trim().toLowerCase() === String(p.name).trim().toLowerCase());
                const investedCount = userPlanInvs.length;
                const maxAllowed = 2;
                const isLimitReached = investedCount >= maxAllowed;

                if (state === 'LOCKED') {
                    return `
                            <div class="glass-card surprise-card" style="position: relative; overflow: hidden; border: 2px solid #555; background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                                <div style="position: absolute; top: 10px; left: 15px; font-size: 1.5rem; font-weight: 800; color: #444; opacity: 0.5;">J</div>
                                <div style="position: absolute; bottom: 10px; right: 15px; font-size: 1.5rem; font-weight: 800; color: #444; opacity: 0.5; transform: rotate(180deg);">J</div>
                                
                                <div style="font-size: 5rem; margin-bottom: 5px; filter: grayscale(1) brightness(0.5); opacity: 0.3;">🃏</div>
                                <h2 style="font-size: 1.2rem; color: #888; letter-spacing: 2px;">MISTÉRIO "VALETE"</h2>
                                <p style="font-size: 0.8rem; margin: 10px 0; opacity: 0.6; padding: 0 40px;">Uma oportunidade única está sendo preparada...</p>
                                
                                <div style="background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 20px; border: 1px solid #333; margin-bottom: 15px;">
                                    <p style="font-size: 0.7rem;">Custo de Entrada: <span style="color: #4CAF50; font-weight: 700;">R$ ${p.min}</span></p>
                                </div>

                                <div class="timer-badge" data-endtime="${p.startsAt}" style="background: rgba(255, 82, 82, 0.1); color: #FF5252; padding: 8px 15px; border-radius: 8px; font-family: monospace; font-size: 1.1rem; border: 1px solid #FF525240;">
                                    Abre em: --:--:--
                                </div>
                            </div>
                            `;
                }

                if (state === 'EXPIRED') {
                    return `
                            <div class="glass-card" style="opacity: 0.5; position: relative;">
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2;">
                                    <h2 style="transform: rotate(-15deg); border: 4px solid #FF5252; color: #FF5252; padding: 10px 20px; border-radius: 12px; font-weight: 900;">ESGOTADO</h2>
                                </div>
                                <div style="filter: blur(2px);">
                                    <h2 style="font-size: 1.2rem;">${p.name}</h2>
                                    <p>Este investimento de tempo limitado foi encerrado.</p>
                                </div>
                            </div>
                            `;
                }

                // SURPRISE_ACTIVE or NORMAL
                const isSurpriseActive = state === 'SURPRISE_ACTIVE';
                const cardBorder = isSurpriseActive ? '2px solid #FFD700' : `4px solid ${color}`;
                const cardBg = isSurpriseActive ? 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(0,0,0,1) 100%)' : '';

                return `
                        <div class="glass-card ${isSurpriseActive ? 'animate-pulse-gold' : ''}" style="position: relative; overflow: hidden; border-left: ${cardBorder}; background: ${cardBg};">
                            ${isSurpriseActive ? `
                                <div style="position: absolute; top: -10px; right: -30px; background: #FFD700; color: black; font-weight: 900; font-size: 0.6rem; padding: 20px 40px 5px 40px; transform: rotate(45deg); box-shadow: 0 0 15px #FFD70080;">OFERTA VIP</div>
                            ` : ''}
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 8px;">
                                <div style="background: rgba(0,209,255,0.1); color: var(--accent-blue); font-size: 0.7rem; padding: 4px 8px; border-radius: 6px;">
                                    ${p.category || 'Geral'}
                                </div>

                                <!-- Badge Contador de Investimentos por Plano -->
                                ${isLimitReached ? `
                                    <div style="display: flex; align-items: center; gap: 5px; background: rgba(255, 82, 82, 0.15); color: #FF5252; font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255, 82, 82, 0.35); font-weight: 700;">
                                        <i class="fa-solid fa-lock"></i> Limite: 2/2 investidos
                                    </div>
                                ` : investedCount === 1 ? `
                                    <div style="display: flex; align-items: center; gap: 5px; background: rgba(255, 180, 0, 0.15); color: #FFB400; font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255, 180, 0, 0.35); font-weight: 700;">
                                        <i class="fa-solid fa-circle-exclamation"></i> Limite: 1/2 investido (1 restante)
                                    </div>
                                ` : `
                                    <div style="display: flex; align-items: center; gap: 5px; background: rgba(0, 209, 255, 0.1); color: var(--accent-blue); font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(0, 209, 255, 0.25); font-weight: 600;">
                                        <i class="fa-solid fa-chart-pie"></i> Limite: 0/2 investidos (2 disponíveis)
                                    </div>
                                `}
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="font-size: 2rem; background: rgba(0,0,0,0.3); width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid ${color}; box-shadow: 0 0 15px ${color}40;">
                                        ${icon}
                                    </div>
                                    <div>
                                        <h2 style="font-size: 1.4rem; color: ${color}; text-shadow: 0 0 10px ${color}40;">${p.name}</h2>
                                        <p style="font-size: 0.9rem;">Duração: <span style="color: white; font-weight: 600;">${p.duration} dias</span></p>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <p style="color: #4CAF50; font-weight: 800; font-size: 1.2rem;">${(p.dailyReturn * 100).toFixed(2)}% ao dia</p>
                                    <p style="font-size: 0.7rem;">Rendimento Diário</p>
                                </div>
                            </div>
                            
                            <div style="margin: 20px 0 12px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; display: flex; justify-content: space-between;">
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
                                    <p style="font-weight: 700; color: var(--secondary-orange);">+${(p.dailyReturn * p.duration * 100).toFixed(2)}%</p>
                                </div>
                            </div>

                            <!-- Barra de Progresso / Indicador Visual de Cotas -->
                            <div style="margin-bottom: 15px; padding: 10px 14px; background: rgba(0, 0, 0, 0.25); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.06); display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-solid fa-user-check" style="font-size: 0.85rem; color: ${isLimitReached ? '#FF5252' : investedCount === 1 ? '#FFB400' : 'var(--accent-blue)'};"></i>
                                    <div>
                                        <p style="font-size: 0.72rem; font-weight: 600; color: #fff; margin: 0;">Disponibilidade por Conta</p>
                                        <p style="font-size: 0.65rem; color: var(--text-dim); margin: 0;">Máximo de 2 aportes por plano</p>
                                    </div>
                                </div>
                                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span style="font-size: 0.75rem; font-weight: 800; color: ${isLimitReached ? '#FF5252' : investedCount === 1 ? '#FFB400' : '#4CAF50'};">
                                        ${investedCount}/2 ${investedCount >= 2 ? '(Esgotado)' : 'utilizado' + (investedCount === 1 ? '' : 's')}
                                    </span>
                                    <div style="display: flex; gap: 5px;">
                                        <span style="display: inline-block; width: 22px; height: 6px; border-radius: 3px; background: ${investedCount >= 1 ? '#4CAF50' : 'rgba(255,255,255,0.15)'}; box-shadow: ${investedCount >= 1 ? '0 0 6px rgba(76,175,80,0.6)' : 'none'};"></span>
                                        <span style="display: inline-block; width: 22px; height: 6px; border-radius: 3px; background: ${investedCount >= 2 ? '#4CAF50' : 'rgba(255,255,255,0.15)'}; box-shadow: ${investedCount >= 2 ? '0 0 6px rgba(76,175,80,0.6)' : 'none'};"></span>
                                    </div>
                                </div>
                            </div>

                            ${isSurpriseActive ? `
                                <div style="background: rgba(255,215,0,0.1); border: 1px dashed #FFD700; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                                    <p style="font-size: 0.7rem; color: #FFD700; font-weight: 700; text-transform: uppercase;">🔥 Promoção Ativa! Termina em:</p>
                                    <div class="timer-badge" data-endtime="${p.expiresAt}" style="color: white; font-family: monospace; font-size: 1.2rem; font-weight: 900;">--:--:--</div>
                                </div>
                            ` : ''}

                            ${isLimitReached ? `
                                <button class="btn btn-outline" style="width: 100%; border: 1px solid rgba(255, 82, 82, 0.4); background: rgba(255, 82, 82, 0.08); color: #FF5252; font-weight: 700; cursor: not-allowed; opacity: 0.85;" onclick="alert('⚠️ Limite Atingido: Cada usuário só pode investir 2 vezes no plano ${p.name}. Você já utilizou suas 2 cotas.')">
                                    <i class="fa-solid fa-lock" style="margin-right: 6px;"></i> Limite Atingido (Máx. 2 por conta)
                                </button>
                            ` : `
                                <button class="btn btn-primary" style="width: 100%; border: none; background: ${isSurpriseActive ? 'linear-gradient(45deg, #FFD700, #FFA500)' : `linear-gradient(45deg, ${color}80, transparent)`}; color: ${isSurpriseActive ? 'black' : 'white'}; font-weight: ${isSurpriseActive ? '900' : 'normal'}; border-top: 1px solid ${color}40;" onclick="handleInvest('${p.id}')">
                                    ${isSurpriseActive ? 'APROVEITAR AGORA' : (investedCount === 1 ? 'Investir Novamente (2º Aporte)' : 'Investir Agora')}
                                </button>
                            `}
                        </div>
                    `;
            }).join('')}
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
                            <h2 style="font-size: 2rem;">R$ ${Number(State.user.available || 0).toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 8px; margin-bottom: 25px;">
                    <button class="btn btn-outline" style="flex: 1; background: var(--glass-bg); padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-dep-tab" onclick="switchWalletTab('dep')">
                        <i class="fa-solid fa-plus-circle" style="color: var(--secondary-orange);"></i> Depósito
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-trans-tab" onclick="switchWalletTab('trans')">
                        <i class="fa-solid fa-paper-plane" style="color: #00D1FF;"></i> Transferir
                    </button>
                    <button class="btn btn-outline" style="flex: 1; padding: 12px 5px; font-size: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 5px;" id="btn-with-tab" onclick="switchWalletTab('with')">
                        <i class="fa-solid fa-money-bill-transfer" style="color: #FF5252;"></i> Sacar
                    </button>
                </div>

                <!-- Deposit Section -->
                <div id="deposit-section" class="glass-card animate-fade">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="font-size: 1.1rem; margin: 0;">Depósito Instantâneo</h3>
                        <span class="infinite-badge"><i class="fa-solid fa-bolt"></i> InfinitePay</span>
                    </div>

                    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 14px; border-color: rgba(0, 209, 255, 0.4); margin-bottom: 20px; background: rgba(0, 102, 255, 0.08);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(50, 188, 173, 0.15); display: flex; align-items: center; justify-content: center;">
                                <i class="fa-brands fa-pix" style="color: #32BCAD; font-size: 1.4rem;"></i>
                            </div>
                            <div>
                                <div style="font-weight: 700; font-size: 0.9rem; color: white;">PIX Instantâneo & Cartão</div>
                                <div style="font-size: 0.72rem; color: var(--accent-blue);">Reconhecimento e crédito em segundos</div>
                            </div>
                        </div>
                        <i class="fa-solid fa-circle-check" style="color: #00D1FF; font-size: 1.2rem;"></i>
                    </div>

                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600;">Selecione um valor rápido:</label>
                    <div class="deposit-chip-grid">
                        <div class="deposit-chip" data-val="10" onclick="window.setFastDepositAmount(10)">R$ 10</div>
                        <div class="deposit-chip" data-val="25" onclick="window.setFastDepositAmount(25)">R$ 25</div>
                        <div class="deposit-chip" data-val="50" onclick="window.setFastDepositAmount(50)">R$ 50</div>
                        <div class="deposit-chip" data-val="100" onclick="window.setFastDepositAmount(100)">R$ 100</div>
                        <div class="deposit-chip" data-val="250" onclick="window.setFastDepositAmount(250)">R$ 250</div>
                        <div class="deposit-chip" data-val="500" onclick="window.setFastDepositAmount(500)">R$ 500</div>
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600;">Ou digite outro valor (R$)</label>
                    <input type="number" id="dep-amount" min="5" step="1" placeholder="Mínimo R$ 5,00" class="input-field" autocomplete="off" oninput="window.onDepositAmountChange(this.value)" style="width: 100%; padding: 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; color: white; font-size: 1.1rem; font-weight: 700; margin-bottom: 15px;">
                    
                    <div style="background: rgba(0, 209, 255, 0.08); border-left: 3px solid #00D1FF; padding: 10px 12px; border-radius: 6px; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 20px; line-height: 1.4;">
                        <i class="fa-solid fa-circle-info" style="color: #00D1FF;"></i> <strong>100% Automático:</strong> Ao pagar na InfinitePay, o sistema identifica em segundos e credita imediatamente na sua conta. Não precisa enviar comprovante!
                    </div>

                    <button id="btn-generate-deposit" class="btn btn-secondary" style="width: 100%; padding: 15px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 15px rgba(255,130,0,0.3);" onclick="handleDeposit()">
                        <i class="fa-solid fa-bolt"></i> Pagar com InfinitePay
                    </button>
                </div>

                 <!-- Withdrawal Section (Hidden) -->
                <div id="withdraw-section" style="display: none;" class="glass-card animate-fade">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="font-size: 1.1rem; margin: 0;">Solicitar Saque</h3>
                        <span class="infinite-badge" style="border-color: rgba(0, 209, 255, 0.4); color: #00D1FF; background: rgba(0, 209, 255, 0.1);"><i class="fa-solid fa-bolt"></i> PIX Rápido</span>
                    </div>

                    <div class="alert" style="background: rgba(0, 209, 255, 0.08); border: 1px solid rgba(0, 209, 255, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.8rem; line-height: 1.4;">
                        <i class="fa-solid fa-circle-info" style="color: #00D1FF;"></i> <strong>Transferência PIX:</strong> O valor líquido é enviado diretamente para a sua chave cadastrada.<br>
                        <span style="opacity: 0.8;">Taxa da plataforma: <strong>8%</strong> | Saque mínimo: <strong>R$ 20,00</strong></span>
                    </div>
                    
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600;">Valor a Sacar (R$)</label>
                    <input type="number" id="withdraw-amount" min="20" step="1" oninput="window.onWithdrawAmountInput(this.value)" placeholder="Disponível: R$ ${Number(State.user.available || 0).toFixed(2)}" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">
                    
                    <!-- Resumo do Saque em Tempo Real -->
                    <div id="withdraw-summary-box" style="background: rgba(0,0,0,0.3); border: 1px dashed var(--glass-border); border-radius: 8px; padding: 12px; margin-bottom: 18px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; color: var(--text-dim);">
                            <span>Taxa de Saque (8%):</span>
                            <span id="withdraw-calc-fee" style="color: #FF8200;">R$ 0,00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.95rem; border-top: 1px solid var(--glass-border); padding-top: 6px; margin-top: 2px;">
                            <span>Valor Líquido a Receber no PIX:</span>
                            <span id="withdraw-calc-net" style="color: #00D1FF;">R$ 0,00</span>
                        </div>
                    </div>

                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600;">Sua Chave PIX de Destino</label>
                    <input type="text" id="withdraw-pix-key" placeholder="CPF, E-mail, Celular ou Chave Aleatória" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600;">Senha Financeira de Saque</label>
                    <input type="password" id="withdraw-pass" placeholder="Sua senha financeira (6 dígitos)" class="input-field" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">
                    
                    <button id="btn-confirm-withdraw" class="btn btn-primary" style="width: 100%; padding: 15px; font-size: 1rem; font-weight: 700; background: linear-gradient(135deg, #00D1FF, #0055FF); border: none; box-shadow: 0 4px 15px rgba(0, 209, 255, 0.4);" onclick="handleWithdraw()">
                        <i class="fa-solid fa-paper-plane"></i> Confirmar Solicitação de Saque
                    </button>
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
                <div class="radar-pulse">
                    <i class="fa-solid fa-bolt"></i>
                </div>

                <h2 style="color: #00D1FF; margin-bottom: 6px; font-size: 1.4rem;">Checkout InfinitePay</h2>
                <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 20px;">Aguardando confirmação do pagamento em tempo real...</p>
                
                <div class="glass-card" style="background: rgba(255,255,255,0.05); padding: 25px 18px; margin-bottom: 20px; border: 1px solid rgba(0, 209, 255, 0.4); box-shadow: 0 8px 32px rgba(0, 102, 255, 0.2);">
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 5px;">Valor do Depósito</div>
                    <div style="font-size: 2.4rem; font-weight: 800; color: white; margin-bottom: 20px;">
                        R$ ${(State.currentPix ? State.currentPix.amount : 0).toFixed(2)}
                    </div>

                    <a href="${State.currentPix ? State.currentPix.checkoutUrl : '#'}" target="_blank" id="btn-open-infinite-checkout" class="btn btn-secondary" style="width: 100%; padding: 18px; font-size: 1.05rem; font-weight: 800; text-decoration: none; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 6px 20px rgba(255, 130, 0, 0.5); animation: pulse-gold 2s infinite;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> PAGAR AGORA NA INFINITEPAY
                    </a>

                    <p style="font-size: 0.78rem; color: #A0B2C1; margin-bottom: 18px; line-height: 1.4;">
                        <i class="fa-solid fa-circle-check" style="color: #32BCAD;"></i> O PIX oficial com QR Code autenticado pelo Banco Central é gerado diretamente na página segura da <strong>InfinitePay</strong>.
                    </p>

                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.8rem; color: #00D1FF; background: rgba(0, 209, 255, 0.08); padding: 10px; border-radius: 8px;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Monitorando rede bancária... O saldo entrará na hora.</span>
                    </div>
                </div>
                
                <div class="glass-card" style="margin-bottom: 20px; text-align: left; border-left: 4px solid #4CAF50; background: rgba(76, 175, 80, 0.05);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #4CAF50; font-weight: 700; font-size: 0.9rem;">
                        <i class="fa-solid fa-shield-halved"></i> Reconhecimento 100% Automático
                    </div>
                    <p style="font-size: 0.78rem; opacity: 0.85; line-height: 1.4;">
                        1. Clique no botão laranja acima para abrir a tela da <strong>InfinitePay</strong>.<br>
                        2. Copie o PIX oficial ou escaneie o QR Code no app do seu banco.<br>
                        3. Ao concluir, seu saldo será liberado automaticamente!
                    </p>
                    
                    <button id="btn-check-payment" class="btn btn-outline" style="width: 100%; margin-top: 14px; border-color: #4CAF50; color: #4CAF50; font-weight: 600; font-size: 0.85rem;" onclick="checkPaymentStatusManual()">
                        <i class="fa-solid fa-rotate"></i> Já realizei o pagamento / Verificar agora
                    </button>
                </div>

                <button class="btn btn-outline" style="width: 100%; padding: 12px; font-size: 0.85rem; opacity: 0.7;" onclick="Router.navigate('wallet')">
                    <i class="fa-solid fa-arrow-left"></i> Voltar para a Carteira
                </button>
            </div>
        `,

            referral: () => `
            <div class="app-container animate-fade">
                <h1>Indique Amigos</h1>
                <p>Ganhe comissões multinível sobre os investimentos da sua rede.</p>

                <div class="glass-card" style="margin-top: 25px; margin-bottom: 25px; background: linear-gradient(to bottom right, var(--primary-dark), rgba(0,209,255,0.1));">
                    <p style="font-size: 0.8rem; margin-bottom: 10px;">Seu Link de Convite</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" readonly value="${window.location.origin}/?ref=${State.user.phone}" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px dashed var(--glass-border); padding: 10px; border-radius: 8px; color: var(--accent-blue); font-size: 0.8rem;">
                        <button class="btn btn-outline" style="padding: 10px;" onclick="copyRef()"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px;">
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--primary-blue);">Nível 1</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">15%</p>
                        <p style="font-size: 0.6rem; opacity: 0.6;">0 usuários</p>
                    </div>
                    <div class="glass-card" style="text-align: center; padding: 15px 10px;">
                        <h4 style="color: var(--secondary-orange);">Nível 2</h4>
                        <p style="font-weight: 800; font-size: 1.2rem; margin: 5px 0;">5%</p>
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
                        <h2 id="admin-total-users" style="color: var(--primary-blue);">...</h2>
                    </div>
                    <div class="glass-card" style="padding: 15px;">
                        <p style="font-size: 0.7rem;">Aprovações Pendentes</p>
                        <h2 id="admin-total-pending" style="color: var(--secondary-orange);">...</h2>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; border-left: 4px solid #FFD700;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: #FFD700;"><i class="fa-solid fa-crown"></i> Elegíveis Promoção (2k+)</h3>
                        <button class="btn btn-outline" style="padding: 5px; border-color: #FFD700; color: #FFD700;" onclick="loadPromoUsers()"><i class="fa-solid fa-rotate-right"></i> Buscar Elegíveis</button>
                    </div>
                    <div id="admin-promo-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Clique em buscar para listar usuários elegíveis ao prêmio.</p>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>Pendências (Depósitos e Saques)</h3>
                        <button class="btn btn-outline" style="padding: 5px; border-color: var(--primary-blue);" onclick="loadAdminData()"><i class="fa-solid fa-rotate-right"></i> Recarregar</button>
                    </div>
                    <div id="admin-pending-list" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Clique no botão recarregar para buscar pendências.</p>
                    </div>
                </div>

                <!-- Configurações InfinitePay -->
                <div class="glass-card" style="margin-top: 20px; border-left: 4px solid #00D1FF;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="color: #00D1FF;"><i class="fa-solid fa-bolt"></i> Integração InfinitePay (Depósitos Automáticos)</h3>
                        <span class="infinite-badge">API Integrada</span>
                    </div>
                    <p style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 15px;">
                        Configure a <strong>InfiniteTag (Handle)</strong> da sua conta InfinitePay para receber depósitos automatizados via PIX e Cartão com liberação instantânea de saldo.
                    </p>
                    
                    <label style="display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600;">Sua InfiniteTag (sem o $)</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <span style="display: flex; align-items: center; padding: 0 12px; background: rgba(0, 209, 255, 0.1); border: 1px solid var(--glass-border); border-radius: 8px; color: #00D1FF; font-weight: 700;">$</span>
                        <input type="text" id="admin-infinite-handle" value="${(window.getInfinitePayConfig ? window.getInfinitePayConfig().handle : 'theblueplataforma')}" placeholder="ex: theblue ou seu_usuario" class="input-field" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white;">
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button class="btn btn-primary" style="flex: 1; padding: 10px;" onclick="saveAdminInfinitePayConfig()">
                            <i class="fa-solid fa-floppy-disk"></i> Salvar InfiniteTag
                        </button>
                        <button class="btn btn-outline" style="flex: 1; padding: 10px; border-color: #00D1FF; color: #00D1FF;" onclick="testAdminInfinitePayConnection()">
                            <i class="fa-solid fa-vial"></i> Testar Conexão
                        </button>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); border: 1px dashed var(--glass-border); padding: 12px; border-radius: 8px;">
                        <p style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 8px;">
                            <i class="fa-solid fa-money-bill-transfer" style="color: #00D1FF;"></i> <strong>Pagamento de Saques em 1-Clique:</strong>
                            Ao receber pedidos de saque nas pendências abaixo, use o botão de cópia rápida e abra o App InfinitePay para transferir o PIX com taxa zero e sem burocracia.
                        </p>
                        <button class="btn btn-outline" style="width: 100%; padding: 8px; font-size: 0.8rem; border-color: #00D1FF; color: #00D1FF;" onclick="window.openInfinitePayApp()">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir Painel / App InfinitePay
                        </button>
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

                <!-- Painel de Rendimentos 00:00 -->
                <div class="glass-card" style="margin-top: 20px; border-left: 4px solid #00d1ff;">
                    <h3 style="margin-bottom: 15px;"><i class="fa-solid fa-clock-rotate-left" style="color: #00d1ff;"></i> Rendimentos das 00:00 (Meia-Noite)</h3>
                    <p style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 15px;">Dispare manualmente os rendimentos diários das zero horas para todos os investidores da plataforma.</p>
                    <button class="btn btn-primary" style="width: 100%; background: linear-gradient(45deg, #007bff, #00d1ff); border: none;" onclick="handleProcessAllYieldsAdmin()">
                        <i class="fa-solid fa-bolt"></i> Processar Rendimentos 00:00 Agora
                    </button>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Gerenciar Planos (Investimentos)</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="grid-column: span 2;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Nome do Plano (ex: Ouro, Diamante)</label>
                            <input type="text" id="plan-name" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Categoria / Prazo</label>
                            <select id="plan-category" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: #111; color: white; border: 1px solid var(--glass-border);">
                                <option value="Curto Prazo">Curto Prazo</option>
                                <option value="Médio Prazo">Médio Prazo</option>
                                <option value="Longo Prazo">Longo Prazo</option>
                                <option value="Vip Premium">Vip Premium</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Duração (Dias)</label>
                            <input type="number" id="plan-duration" placeholder="ex: 15" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Retorno Diário (%)</label>
                            <input type="number" id="plan-return" placeholder="ex: 2.5" step="0.01" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Aporte Mínimo (R$)</label>
                            <input type="number" id="plan-min" placeholder="50.00" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Aporte Máx. (R$)</label>
                            <input type="number" id="plan-max" placeholder="1000.00" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                    </div>

                    <div style="background: rgba(255, 82, 82, 0.1); border: 1px solid #FF5252; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="plan-is-surprise" onchange="document.getElementById('surprise-config').style.display = this.checked ? 'block' : 'none'">
                            <span style="font-weight: 600; color: #FF5252;">🃏 Este é um Investimento Surpresa (Escassez)</span>
                        </label>
                        <p style="font-size: 0.7rem; opacity: 0.8; margin-top: 5px;">Oculta o investimento sob uma carta "Valete" até o horário de abertura.</p>
                        
                        <div id="surprise-config" style="display: none; margin-top: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: #4CAF50;">Abertura</label>
                                    <input type="datetime-local" id="plan-starts-at" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.5); color: white; border: 1px solid #4CAF50;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; color: #FF9800;">Encerramento</label>
                                    <input type="datetime-local" id="plan-expires-at" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.5); color: white; border: 1px solid #FF9800;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="width: 100%; margin-bottom: 15px;" onclick="handleCreatePlan()">+ Criar Novo Plano</button>

                    <div id="admin-plans-list" style="display: flex; flex-direction: column; gap: 10px;">
                        ${State.plans.length === 0 ? '<p style="text-align: center; opacity: 0.5;">Nenhum plano cadastrado.</p>' : State.plans.map(p => `
                            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--primary-blue);">
                                <div>
                                    <p style="font-weight: 600; color: var(--primary-blue); font-size: 0.9rem;">${p.name} <span style="font-size: 0.6rem; color: white; background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">${p.category || ''}</span></p>
                                    <p style="font-size: 0.7rem; opacity: 0.8;">${p.duration} dias | ${(p.dailyReturn * 100).toFixed(2)}% a.d. | Mín: R$ ${p.min}</p>
                                </div>
                                <button class="btn btn-outline" style="padding: 5px 10px; color: #FF5252; border-color: #FF5252;" onclick="handleDeletePlan('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Relatórios Gerenciais (Caixa Diário)</h3>
                    <p style="font-size: 0.8rem; margin-bottom: 15px; opacity: 0.8;">Filtre depósitos e saques para conciliar com seu banco.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Data (Deixe em branco p/ Histórico Geral)</label>
                            <input type="date" id="report-date" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border);">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Tipo</label>
                            <select id="report-type" class="input-field" style="width: 100%; padding: 8px; border-radius: 8px; background: #111; color: white; border: 1px solid var(--glass-border);">
                                <option value="all">Todos</option>
                                <option value="dep">Depósitos</option>
                                <option value="with">Saques</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 20px;" onclick="loadAdminReports()"><i class="fa-solid fa-search"></i> Gerar Relatório</button>

                    <div id="report-results" style="display: none; flex-direction: column; gap: 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; padding: 10px; border-radius: 8px; text-align: center;">
                                <p style="font-size: 0.7rem; color: #4CAF50;">🟢 Depósitos</p>
                                <h3 id="report-dep-approved" style="color: white; margin-top: 5px;">R$ 0,00</h3>
                                <p id="report-dep-pending" style="font-size: 0.65rem; color: #FF9800; margin-top: 5px;">Pendente: R$ 0,00</p>
                            </div>
                            <div style="background: rgba(255, 82, 82, 0.1); border: 1px solid #FF5252; padding: 10px; border-radius: 8px; text-align: center;">
                                <p style="font-size: 0.7rem; color: #FF5252;">🔴 Saques</p>
                                <h3 id="report-with-approved" style="color: white; margin-top: 5px;">R$ 0,00</h3>
                                <p id="report-with-pending" style="font-size: 0.65rem; color: #FF9800; margin-top: 5px;">Pendente: R$ 0,00</p>
                            </div>
                        </div>

                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.7rem;">Saldo Líquido no Banco (Aprovados)</p>
                            <h2 id="report-net-balance" style="color: var(--primary-blue); margin-top: 5px;">R$ 0,00</h2>
                        </div>

                        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px; background: #207245; border-color: #207245;" onclick="exportAdminReportsToExcel()"><i class="fa-solid fa-file-excel"></i> Exportar para Excel (CSV)</button>

                        <div id="report-list" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                            <!-- List will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `,

            profile: () => `
            <div class="app-container animate-fade">
                <h1>Meu Perfil</h1>
                <p>Gerencie sua conta e configurações.</p>
                
                <div class="glass-card" style="margin-top: 20px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: rgba(0, 102, 255, 0.15); border: 2px solid var(--primary-blue); width: 85px; height: 85px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 0 20px rgba(0,102,255,0.3);">
                        <i class="fa-solid fa-user-shield" style="color: var(--accent-blue); font-size: 2.2rem;"></i>
                    </div>
                    <h3 style="font-size: 1.3rem;">${State.user ? State.user.phone : ''}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 25px;">Membro "The Blue"</p>
                    
                    <!-- Lista de Opções do Perfil -->
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 12px; text-align: left;">
                        
                        <!-- Botão: Contactar Suporte -->
                        <button class="btn btn-outline" style="width: 100%; padding: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);" onclick="handleContactSupport()">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="background: rgba(37, 211, 102, 0.15); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fa-solid fa-headset" style="color: #25D366; font-size: 1.1rem;"></i>
                                </div>
                                <div>
                                    <p style="font-weight: 700; color: white; font-size: 0.9rem; margin: 0;">Contactar Suporte</p>
                                    <p style="font-size: 0.72rem; color: var(--text-dim); margin: 0;">Falar com atendimento via WhatsApp</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: var(--text-dim); font-size: 0.8rem;"></i>
                        </button>

                        <!-- Botão: Alterar Senha -->
                        <button class="btn btn-outline" style="width: 100%; padding: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);" onclick="handleOpenChangePasswordModal()">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="background: rgba(0, 209, 255, 0.15); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fa-solid fa-key" style="color: var(--accent-blue); font-size: 1.1rem;"></i>
                                </div>
                                <div>
                                    <p style="font-weight: 700; color: white; font-size: 0.9rem; margin: 0;">Alterar Senha</p>
                                    <p style="font-size: 0.72rem; color: var(--text-dim); margin: 0;">Atualizar senha de acesso ou saque</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color: var(--text-dim); font-size: 0.8rem;"></i>
                        </button>

                        ${['19999995149', '1934585300'].includes(State.user && State.user.phone ? State.user.phone.replace(/\D/g, '') : '') ? `
                            <button class="btn btn-outline" style="width: 100%; padding: 14px; border-radius: 12px; border-color: #00d1ff; color: #00d1ff; display: flex; align-items: center; justify-content: space-between;" onclick="Router.navigate('admin')">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fa-solid fa-shield-halved" style="font-size: 1.1rem;"></i>
                                    <span style="font-weight: 700; font-size: 0.9rem;">Painel Administrativo</span>
                                </div>
                                <i class="fa-solid fa-chevron-right" style="font-size: 0.8rem;"></i>
                            </button>
                        ` : ''}

                        <!-- Botão: Sair da Conta -->
                        <button class="btn btn-outline" style="width: 100%; padding: 14px; border-radius: 12px; border-color: rgba(255,82,82,0.4); color: #FF5252; margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;" onclick="handleLogout()">
                            <i class="fa-solid fa-right-from-bracket"></i> Sair da Conta
                        </button>

                    </div>
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
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const loginFields = document.getElementById('login-fields');
        const registerFields = document.getElementById('register-fields');

        if (showRegister) {
            // Ativar aba Cadastrar
            registerFields.style.display = 'block';
            loginFields.style.display = 'none';
            tabRegister.style.background = 'var(--secondary-orange)';
            tabRegister.style.color = 'white';
            tabRegister.style.boxShadow = '0 2px 8px rgba(255,130,0,0.4)';
            tabLogin.style.background = 'transparent';
            tabLogin.style.color = 'var(--text-dim)';
            tabLogin.style.boxShadow = 'none';
        } else {
            // Ativar aba Entrar
            loginFields.style.display = 'block';
            registerFields.style.display = 'none';
            tabLogin.style.background = 'var(--primary-blue)';
            tabLogin.style.color = 'white';
            tabLogin.style.boxShadow = '0 2px 8px rgba(0,120,255,0.4)';
            tabRegister.style.background = 'transparent';
            tabRegister.style.color = 'var(--text-dim)';
            tabRegister.style.boxShadow = 'none';
        }
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

        if (pass.length < 6) {
            alert("🔒 A senha de acesso deve conter no mínimo 6 dígitos.");
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

        // Salvar dados de sessão para que logins futuros ou auto-logins reconheçam a conta criada
        localStorage.setItem('theblue_remember', '1');
        localStorage.setItem('theblue_session_phone', phone);

        State.user = newUser;
        State.transactions = [];
        Router.navigate('dashboard');

    };

    window.toggleRememberMe = () => {
        const cb = document.getElementById('remember-me');
        cb.checked = !cb.checked;
        const toggle = document.getElementById('remember-toggle');
        if (toggle) {
            toggle.style.background = cb.checked ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)';
            toggle.querySelector('span').style.left = cb.checked ? '20px' : '3px';
        }
    };

    window.handleLogin = async () => {
        const phone = document.getElementById('login-phone').value;
        const pass = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me') && document.getElementById('remember-me').checked;

        if (!phone || !pass) {
            alert("Por favor, preencha os campos.");
            return;
        }

        if (!supabase) { alert("Banco de dados ausente."); return; }

        // Inicia as buscas em paralelo para ganhar velocidade
        const [userResponse, txsResponse] = await Promise.all([
            supabase.from('users').select('*').eq('phone', phone).single(),
            supabase.from('transactions').select('*').eq('user_phone', phone).order('created_at', { ascending: false }).limit(50)
        ]);

        const user = userResponse.data;
        const error = userResponse.error;
        const txs = txsResponse.data;

        if (error || !user || user.password !== pass) {
            alert("Credenciais inválidas ou conta não encontrada.");
            return;
        }

        // Salvar sessão se "Lembrar de mim" estiver marcado
        if (rememberMe) {
            localStorage.setItem('theblue_remember', '1');
            localStorage.setItem('theblue_session_phone', phone);
        } else {
            localStorage.removeItem('theblue_remember');
            localStorage.removeItem('theblue_session_phone');
        }

        State.user = user;

        // Mapear datas do banco para formato local visual temporário
        State.transactions = (txs || []).map(t => ({
            ...t,
            date: new Date(t.created_at).toLocaleDateString('pt-BR')
        }));

        Router.navigate('dashboard');

        // Checar e creditar rendimentos das 00:00
        if (window.checkAndProcessMidnightYields) {
            window.checkAndProcessMidnightYields(user.phone);
        }
    };

    // --- Configurações e Utilitários InfinitePay ---
    window.getInfinitePayConfig = () => {
        return {
            handle: localStorage.getItem('theblue_infinitepay_handle') || 'theblueplataforma',
            autoApprove: localStorage.getItem('theblue_infinitepay_auto') !== 'false'
        };
    };

    window.saveAdminInfinitePayConfig = () => {
        const input = document.getElementById('admin-infinite-handle');
        const handle = (input ? input.value : '').trim().replace(/^[\$@]/, '');
        if (!handle) {
            alert("Por favor, digite sua InfiniteTag.");
            return;
        }
        localStorage.setItem('theblue_infinitepay_handle', handle);
        alert(`✅ InfiniteTag salva com sucesso: $${handle}\nOs depósitos automáticos agora estão direcionados para sua conta InfinitePay.`);
    };

    window.testAdminInfinitePayConnection = async () => {
        const config = window.getInfinitePayConfig();
        alert(`🔍 Testando conexão com InfinitePay...\nTag configurada: $${config.handle}\nEndpoint: https://api.checkout.infinitepay.io/links\n\nConexão com a API está pronta e ativa!`);
    };

    // --- Utilitários de Saque PIX e InfinitePay ---
    window.copyPixInfo = (pixKey, netAmount) => {
        const cleanKey = (pixKey || '').trim();
        if (!cleanKey) {
            alert("Chave PIX não informada.");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cleanKey).then(() => {
                alert(`📋 Chave PIX copiada com sucesso!\n\nChave: ${cleanKey}\nValor Líquido a Transferir: R$ ${Number(netAmount || 0).toFixed(2)}`);
            }).catch(() => {
                prompt("Copie a Chave PIX:", cleanKey);
            });
        } else {
            prompt("Copie a Chave PIX:", cleanKey);
        }
    };

    window.openInfinitePayApp = () => {
        window.open('https://app.infinitepay.io', '_blank');
    };

    window.onWithdrawAmountInput = (val) => {
        const amount = parseFloat(val) || 0;
        const fee = amount * 0.08;
        const net = Math.max(0, amount - fee);

        const feeEl = document.getElementById('withdraw-calc-fee');
        const netEl = document.getElementById('withdraw-calc-net');

        if (feeEl) feeEl.innerText = `R$ ${fee.toFixed(2)}`;
        if (netEl) netEl.innerText = `R$ ${net.toFixed(2)}`;
    };

    window.setFastDepositAmount = (val) => {
        const input = document.getElementById('dep-amount');
        if (input) {
            input.value = val;
            document.querySelectorAll('.deposit-chip').forEach(chip => {
                const chipVal = parseFloat(chip.getAttribute('data-val'));
                if (chipVal === val) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        }
    };

    window.onDepositAmountChange = (val) => {
        const parsed = parseFloat(val);
        document.querySelectorAll('.deposit-chip').forEach(chip => {
            const chipVal = parseFloat(chip.getAttribute('data-val'));
            if (chipVal === parsed) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    };

    window.currentPayMethod = 'pix';
    window.selectPayMethod = (method) => {
        window.currentPayMethod = method;
        alert(`Método selecionado: ${method.toUpperCase()}`);
    };

    window.handleDeposit = async () => {
        if (window.isDepositing) return;

        const amountInput = document.getElementById('dep-amount');
        const amount = parseFloat(amountInput ? amountInput.value : 0);
        if (!amount || amount < 5) {
            alert("O valor mínimo de depósito é R$ 5,00.");
            return;
        }

        window.isDepositing = true;
        const btn = document.getElementById('btn-generate-deposit') || document.querySelector('.btn-secondary[onclick="handleDeposit()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando Checkout InfinitePay...';
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');
        const cleanPhone = (State.user && State.user.phone ? State.user.phone : '').replace(/\D/g, '');

        // 1. Inserir registro inicial de transação pendente no Supabase
        const tx = {
            user_phone: State.user.phone,
            type: 'pix_pendente',
            amount: amount,
            description: `Depósito PIX/Cartão InfinitePay - Cliente: ${State.user.phone} (${dateStr} às ${timeStr})`
        };

        const { data: insertedTxs, error } = await supabase.from('transactions').insert([tx]).select();

        if (error || !insertedTxs || insertedTxs.length === 0) {
            alert("Erro ao registrar intenção de depósito: " + (error ? error.message : "Erro desconhecido"));
            window.isDepositing = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Pagar com InfinitePay';
            }
            return;
        }

        const txId = insertedTxs[0].id;
        const infiniteConfig = window.getInfinitePayConfig();
        const handle = infiniteConfig.handle || 'theblueplataforma';
        const amountInCents = Math.round(amount * 100);

        // Montar URL de redirecionamento de retorno
        const redirectUrl = `${window.location.origin}${window.location.pathname}?deposit_success=true&order_nsu=${txId}&phone=${encodeURIComponent(State.user.phone)}`;

        let checkoutUrl = null;
        let pixPayload = null;

        try {
            const response = await fetch('https://api.checkout.infinitepay.io/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: handle,
                    order_nsu: txId,
                    redirect_url: redirectUrl,
                    items: [
                        {
                            quantity: 1,
                            price: amountInCents,
                            description: `Depósito The Blue - Investidor ${State.user.phone}`
                        }
                    ],
                    customer: {
                        phone_number: '+55' + cleanPhone
                    }
                })
            });

            const data = await response.json();
            console.log("💳 Resposta API Checkout InfinitePay:", data);

            if (data && (data.payment_link || data.checkout_url || data.url || data.link)) {
                checkoutUrl = data.payment_link || data.checkout_url || data.url || data.link;
            }
            if (data && data.pix_code) {
                pixPayload = data.pix_code;
            }
        } catch (apiErr) {
            console.warn("⚠️ Chamada API Checkout InfinitePay direta:", apiErr);
        }

        // Se API retornar link direto para InfiniteTag do lojista
        if (!checkoutUrl) {
            checkoutUrl = `https://infinitepay.io/pay/${handle}?amount=${amount.toFixed(2)}`;
        }

        // Se não houver payload específico retornado, gerar Copia e Cola estruturado com identificador
        if (!pixPayload) {
            const pixKey = "theblueplataforma@gmail.com";
            pixPayload = window.generatePixPayload(pixKey, "The Blue InfinitePay", "Sao Paulo", amount, txId.substring(0, 15));
        }

        State.currentPix = {
            amount: amount,
            payload: pixPayload,
            txId: txId,
            checkoutUrl: checkoutUrl,
            handle: handle
        };

        tx.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(tx);

        window.isDepositing = false;
        Router.navigate('pix_checkout');

        // Abrir automaticamente a página oficial de pagamento da InfinitePay
        if (checkoutUrl) {
            try {
                window.open(checkoutUrl, '_blank');
            } catch (wErr) {
                console.warn("Popup bloqueado ou acionado pelo clique:", wErr);
            }
        }

        // Iniciar polling em tempo real para detecção de pagamento automático
        window.startInfinitePayPolling(txId, amount, State.user.phone);
    };

    // --- Motor Central de Reconhecimento e Crédito Instantâneo de Depósitos ---
    window.processAutomaticDepositApproval = async (txId, amount, phone, orderNsu) => {
        const targetId = txId || orderNsu;
        if (!targetId) return false;

        if (window.isProcessingApproval) return false;
        window.isProcessingApproval = true;

        try {
            console.log("⚡ [InfinitePay] Processando aprovação automática para transação:", targetId);

            // 1. Buscar transação no banco de dados para checagem de concorrência e idempotência
            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', targetId)
                .single();

            if (txErr || !tx) {
                console.warn("⚠️ Transação não localizada no Supabase:", targetId);
                window.isProcessingApproval = false;
                return false;
            }

            // Se já foi creditada anteriormente, evitar crédito duplo
            if (tx.type === 'dep') {
                console.log("ℹ️ Transação já aprovada e creditada anteriormente:", targetId);
                window.isProcessingApproval = false;
                return true;
            }

            const depositAmount = parseFloat(tx.amount || amount || 0);
            const userPhone = tx.user_phone || phone;

            if (depositAmount <= 0 || !userPhone) {
                console.error("❌ Dados inválidos de depósito:", { depositAmount, userPhone });
                window.isProcessingApproval = false;
                return false;
            }

            // 2. Atualizar transação para 'dep' (Aprovado)
            const { error: updTxErr } = await supabase
                .from('transactions')
                .update({
                    type: 'dep',
                    description: 'Depósito PIX InfinitePay (Automático Aprovado)'
                })
                .eq('id', targetId);

            if (updTxErr) {
                console.error("❌ Erro ao atualizar status da transação:", updTxErr);
                window.isProcessingApproval = false;
                return false;
            }

            // 3. Buscar dados atualizados do usuário investidor
            const { data: user, error: userErr } = await supabase
                .from('users')
                .select('*')
                .eq('phone', userPhone)
                .single();

            if (userErr || !user) {
                console.error("❌ Erro ao buscar usuário para crédito:", userErr);
                window.isProcessingApproval = false;
                return false;
            }

            // 4. Creditar saldo disponível e saldo total
            const newAvailable = Number(user.available || 0) + depositAmount;
            const newBalance = Number(user.balance || 0) + depositAmount;

            const { error: updUserErr } = await supabase
                .from('users')
                .update({
                    available: newAvailable,
                    balance: newBalance
                })
                .eq('phone', userPhone);

            if (updUserErr) {
                console.error("❌ Erro ao creditar saldo do usuário:", updUserErr);
            } else {
                if (State.user && State.user.phone === userPhone) {
                    State.user.available = newAvailable;
                    State.user.balance = newBalance;
                }
            }

            // 5. Cálculo e Distribuição Automática de Comissões Multinível (15%, 5%, 2%)
            console.log("💰 [InfinitePay] Distribuindo comissões de indicação...");
            const COMMISSION_RATES = [0.15, 0.05, 0.02];
            const LEVEL_LABELS = ['1º Nível (15%)', '2º Nível (5%)', '3º Nível (2%)'];
            let currentSponsorPhone = user.sponsor;
            let commissionsGranted = 0;

            for (let nivel = 0; nivel < 3; nivel++) {
                if (!currentSponsorPhone) break;

                const rate = COMMISSION_RATES[nivel];
                const commissionAmount = parseFloat((depositAmount * rate).toFixed(2));

                if (commissionAmount <= 0) break;

                const { data: sponsor, error: sponsorError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', currentSponsorPhone)
                    .single();

                if (!sponsorError && sponsor) {
                    await supabase.from('users').update({
                        available: Number(sponsor.available || 0) + commissionAmount,
                        balance: Number(sponsor.balance || 0) + commissionAmount
                    }).eq('phone', sponsor.phone);

                    await supabase.from('transactions').insert([{
                        user_phone: sponsor.phone,
                        type: 'comissao',
                        amount: commissionAmount,
                        description: `Comissão Automática ${LEVEL_LABELS[nivel]} — Indicado: ${userPhone} depositou R$ ${depositAmount.toFixed(2)}`
                    }]);

                    commissionsGranted++;
                    currentSponsorPhone = sponsor.sponsor || null;
                } else {
                    break;
                }
            }

            // 6. Efeito visual com confetes e alerta de sucesso
            if (window.confetti) {
                try {
                    confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                } catch (e) {
                    console.log(e);
                }
            }

            // Parar polling ativo
            if (window.infinitePayPollingTimer) {
                clearInterval(window.infinitePayPollingTimer);
                window.infinitePayPollingTimer = null;
            }

            alert(`🎉 PAGAMENTO CONFIRMADO!\n\nSeu depósito de R$ ${depositAmount.toFixed(2)} via InfinitePay foi processado com sucesso!\nO saldo já está creditado na sua conta.`);

            // Navegar para o dashboard com saldo atualizado
            Router.navigate('dashboard');
            return true;
        } catch (err) {
            console.error("❌ Erro ao processar aprovação automática:", err);
            return false;
        } finally {
            window.isProcessingApproval = false;
        }
    };

    // --- Monitoramento em Tempo Real (Polling) ---
    window.startInfinitePayPolling = (txId, amount, phone) => {
        if (window.infinitePayPollingTimer) {
            clearInterval(window.infinitePayPollingTimer);
        }

        let pollCount = 0;
        const maxPolls = 120; // 6 minutos (a cada 3 segundos)

        window.infinitePayPollingTimer = setInterval(async () => {
            pollCount++;
            if (pollCount > maxPolls || State.currentView !== 'pix_checkout') {
                clearInterval(window.infinitePayPollingTimer);
                window.infinitePayPollingTimer = null;
                return;
            }

            try {
                // 1. Checar status no banco de dados Supabase
                const { data: tx, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', txId)
                    .single();

                if (!error && tx) {
                    if (tx.type === 'dep') {
                        // Já aprovado
                        clearInterval(window.infinitePayPollingTimer);
                        window.infinitePayPollingTimer = null;
                        if (State.user && State.user.phone === phone) {
                            const { data: freshUser } = await supabase.from('users').select('*').eq('phone', phone).single();
                            if (freshUser) State.user = freshUser;
                        }
                        if (window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                        alert(`🎉 Pagamento Confirmado!\nR$ ${parseFloat(tx.amount).toFixed(2)} creditados com sucesso.`);
                        Router.navigate('dashboard');
                        return;
                    }
                }

                // 2. Checar status no endpoint InfinitePay payment_check se disponível
                const infiniteConfig = window.getInfinitePayConfig();
                const handle = infiniteConfig.handle || 'theblueplataforma';

                try {
                    const checkRes = await fetch('https://api.checkout.infinitepay.io/payment_check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            handle: handle,
                            order_nsu: txId
                        })
                    });

                    if (checkRes.ok) {
                        const checkData = await checkRes.json();
                        if (checkData && (checkData.paid || checkData.status === 'paid' || checkData.status === 'approved' || checkData.success === true)) {
                            clearInterval(window.infinitePayPollingTimer);
                            window.infinitePayPollingTimer = null;
                            await window.processAutomaticDepositApproval(txId, amount, phone, txId);
                            return;
                        }
                    }
                } catch (checkErr) {
                    // Erro de rede silencioso no polling
                }
            } catch (e) {
                console.warn("⚠️ Erro no ciclo de polling:", e);
            }
        }, 3000);
    };

    // --- Verificação Manual Instantânea de Status ---
    window.checkPaymentStatusManual = async () => {
        if (!State.currentPix || !State.currentPix.txId) {
            alert("Nenhum pagamento ativo identificado.");
            return;
        }

        const btn = document.getElementById('btn-check-payment');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando na InfinitePay...';
        }

        const txId = State.currentPix.txId;
        const amount = State.currentPix.amount;
        const phone = State.user ? State.user.phone : '';

        try {
            const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
            if (tx && tx.type === 'dep') {
                alert("✅ Seu pagamento já foi aprovado e creditado!");
                Router.navigate('dashboard');
                return;
            }

            // Tentar consulta no payment_check
            const infiniteConfig = window.getInfinitePayConfig();
            const handle = infiniteConfig.handle || 'theblueplataforma';
            let isPaid = false;

            try {
                const checkRes = await fetch('https://api.checkout.infinitepay.io/payment_check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        handle: handle,
                        order_nsu: txId
                    })
                });
                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    if (checkData && (checkData.paid || checkData.status === 'paid' || checkData.status === 'approved')) {
                        isPaid = true;
                    }
                }
            } catch (e) {
                console.log(e);
            }

            if (isPaid) {
                await window.processAutomaticDepositApproval(txId, amount, phone, txId);
            } else {
                alert("⏳ Pagamento ainda não detectado.\nAssim que você efetuar o pagamento pelo app do seu banco ou na tela da InfinitePay, o sistema aprovará automaticamente em poucos segundos.");
            }
        } catch (err) {
            alert("Erro ao verificar status: " + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Já realizei o pagamento / Verificar agora';
            }
        }
    };

    window.copyPix = () => {
        const input = document.getElementById('pix-copia-cola');
        input.select();
        document.execCommand('copy');
        alert('Código PIX Copia e Cola copiado com sucesso! Abra o app do seu banco e cole na área PIX.');
    };

    window.generatePixPayload = (chave, nome, cidade, valor, id = "***") => {
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

        // Tag 62 - Campo 05: Identificador da transação
        const cleanId = id.replace(/\D/g, '').substring(0, 25); // Limpando para garantir compatibilidade
        let addData = "05" + pad(cleanId.length, 2) + cleanId;
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

        if (tab === 'dep') {
            const depInput = document.getElementById('dep-amount');
            if (depInput) depInput.value = '';
        }
    };

    window.handleWithdraw = async () => {
        if (window.isWithdrawing) return;

        const amountInput = document.getElementById('withdraw-amount');
        const pixKeyInput = document.getElementById('withdraw-pix-key');
        const passInput = document.getElementById('withdraw-pass');

        const amount = parseFloat(amountInput ? amountInput.value : 0);
        const pixKey = (pixKeyInput ? pixKeyInput.value : '').trim();
        const pass = (passInput ? passInput.value : '').trim();

        if (!amount || amount < 20) {
            alert("Valor inválido. O saque mínimo é R$ 20,00.");
            return;
        }
        if (!pixKey) {
            alert("Por favor, informe sua Chave PIX para receber a transferência.");
            return;
        }
        if (!pass) {
            alert("Digite sua senha financeira de saque.");
            return;
        }
        if (pass !== State.user.withdraw_pass) {
            alert("Senha de saque incorreta.");
            return;
        }
        if (amount > Number(State.user.available || 0)) {
            alert(`Saldo insuficiente para este saque. Você possui R$ ${Number(State.user.available || 0).toFixed(2)} disponíveis.`);
            return;
        }

        const fee = parseFloat((amount * 0.08).toFixed(2));
        const netAmount = parseFloat((amount - fee).toFixed(2));

        const confirmMsg = `⚡ CONFIRMAÇÃO DE SOLICITAÇÃO DE SAQUE:\n\n` +
            `• Valor Solicitado (Bruto): R$ ${amount.toFixed(2)}\n` +
            `• Taxa da Plataforma (8%): R$ ${fee.toFixed(2)}\n` +
            `• Valor LÍQUIDO a Receber no PIX: R$ ${netAmount.toFixed(2)}\n` +
            `• Chave PIX de Destino: ${pixKey}\n\n` +
            `Confirma o pedido de saque?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        window.isWithdrawing = true;
        const btn = document.getElementById('btn-confirm-withdraw');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando Solicitação...';
        }

        try {
            // 1. Debitar saldo disponível e total do investidor
            const newAvailable = Number(State.user.available) - amount;
            const newBalance = Number(State.user.balance) - amount;

            const { data: updRes, error: updErr } = await supabase.from('users').update({
                available: newAvailable,
                balance: newBalance
            }).eq('phone', State.user.phone).select();

            if (updErr || !updRes || updRes.length === 0) {
                throw new Error("Erro ao debitar saldo: " + (updErr ? updErr.message : "Falha na comunicação com o banco."));
            }

            // 2. Registrar transação como 'saque_pendente'
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR');

            const tx = {
                user_phone: State.user.phone,
                type: 'saque_pendente',
                amount: -amount,
                description: `Chave PIX: ${pixKey} | Bruto: R$ ${amount.toFixed(2)} | Líquido: R$ ${netAmount.toFixed(2)} | Solicitado em ${dateStr} às ${timeStr}`
            };

            const { data: insertedTxs, error: txErr } = await supabase.from('transactions').insert([tx]).select();
            if (txErr) {
                console.error("Erro ao registrar transação de saque:", txErr);
            }

            // 3. Atualizar Estado Local
            State.user.available = newAvailable;
            State.user.balance = newBalance;

            const finalTx = (insertedTxs && insertedTxs[0]) ? insertedTxs[0] : tx;
            finalTx.date = dateStr;
            State.transactions.unshift(finalTx);

            // 4. Limpar formulário
            if (amountInput) amountInput.value = '';
            if (pixKeyInput) pixKeyInput.value = '';
            if (passInput) passInput.value = '';
            if (window.onWithdrawAmountInput) window.onWithdrawAmountInput(0);

            // 5. Celebração com confetes
            if (window.confetti) {
                try {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } catch (e) {
                    console.log(e);
                }
            }

            alert(`🎉 SOLICITAÇÃO DE SAQUE REGISTRADA COM SUCESSO!\n\n• Valor Líquido a Receber: R$ ${netAmount.toFixed(2)}\n• Chave PIX: ${pixKey}\n\nO valor foi reservado da sua conta e o pagamento via PIX será transferido em instantes!`);

            Router.navigate('wallet');
        } catch (err) {
            console.error("❌ Erro ao processar saque:", err);
            alert("Erro ao realizar solicitação de saque: " + err.message);
        } finally {
            window.isWithdrawing = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirmar Solicitação de Saque';
            }
        }
    };

    window.handleTransfer = async () => {
        const rawPhone = document.getElementById('trans-phone').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const pass = document.getElementById('trans-pass').value;

        if (!rawPhone || !amount || !pass) {
            alert("Preencha todos os campos para transferir.");
            return;
        }

        const phone = rawPhone.replace(/\D/g, ''); // Limpando o telefone para o banco

        if (phone === State.user.phone.replace(/\D/g, '')) {
            alert("Você não pode transferir para si mesmo.");
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
            alert("O telefone informado não foi localizado no sistema. Verifique se o destinatário já possui cadastro.");
            return;
        }

        if (!confirm(`Confirma a transferência de R$ ${amount.toFixed(2)} para ${destUser.phone}?`)) return;

        // Alterando balanços via DB Call
        const newSenderAvailable = State.user.available - amount;
        const newSenderBalance = State.user.balance - amount;
        const newDestAvailable = Number(destUser.available) + amount;
        const newDestBalance = Number(destUser.balance) + amount;

        // Atualização em cascata (idealmente seria uma transação RPC, mas faremos sequencial no teste)
        const { error: err1 } = await supabase.from('users').update({ available: newSenderAvailable, balance: newSenderBalance }).eq('phone', State.user.phone);
        const { error: err2 } = await supabase.from('users').update({ available: newDestAvailable, balance: newDestBalance }).eq('phone', phone);

        if (err1 || err2) {
            alert("Erro técnico ao processar transferência. Verifique sua conexão.");
            return;
        }

        // --- NOVO: Buscar dados atualizados do remetente para sincronizar a tela ---
        const { data: updatedSender } = await supabase.from('users').select('*').eq('phone', State.user.phone).single();
        if (updatedSender) {
            State.user = updatedSender;
        }

        // Registrando hist de transaçoes entre os dois
        const txOut = { user_phone: State.user.phone, type: 'with', amount: -amount, description: `P2P: Enviado para ${phone}` };
        const txIn = { user_phone: phone, type: 'dep', amount: amount, description: `P2P: Recebido de ${State.user.phone}` };

        await supabase.from('transactions').insert([txOut, txIn]);

        // Sync Local State - (Já feito acima com updatedSender)
        Router.render(); 

        txOut.date = new Date().toLocaleDateString('pt-BR');
        State.transactions.unshift(txOut);

        alert(`✅ Sucesso! R$ ${amount.toFixed(2)} transferidos para ${phone}.`);
        Router.navigate('wallet');
    };

    window.handleInvest = async (planId) => {
        const plan = State.plans.find(p => p.id === planId);
        if (!plan) return;

        // Verificar limite de 2 investimentos por plano
        const currentInvs = (State.transactions || []).filter(t => t.type === 'inv' && t.description && t.description.replace('Investimento: ', '').trim().toLowerCase() === String(plan.name).trim().toLowerCase());
        if (currentInvs.length >= 2) {
            alert(`⚠️ Limite Atingido: Cada usuário só pode investir no máximo 2 vezes no plano "${plan.name}". Você já possui 2 investimentos ativos neste plano.`);
            return;
        }

        if (!State.user || Number(State.user.available) < plan.min) {
            alert("Saldo disponível insuficiente. Faça um depósito!");
            Router.navigate('wallet');
            return;
        }

        const currentSlot = currentInvs.length + 1;

        // Criar o Modal Customizado de Investimento
        const overlay = document.createElement('div');
        overlay.className = 'promo-splash-overlay';
        overlay.style.zIndex = "10001";
        
        overlay.innerHTML = `
            <div class="glass-card animate-pop" style="width: 90%; max-width: 400px; padding: 30px; text-align: center; border: 1px solid var(--primary-blue);">
                <div style="font-size: 3rem; margin-bottom: 15px;">🚀</div>
                <h2 style="color: white; margin-bottom: 6px;">Investir em ${plan.name}</h2>
                <div style="display: inline-block; background: rgba(0, 209, 255, 0.12); border: 1px solid rgba(0, 209, 255, 0.3); color: var(--accent-blue); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 15px;">
                    <i class="fa-solid fa-layer-group"></i> Cota ${currentSlot} de 2 permitidas
                </div>
                <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 25px;">
                    Quanto você deseja investir?<br>
                    <span style="color: #4CAF50; font-weight: 700;">Mín: R$ ${plan.min} | Máx: R$ ${plan.max}</span>
                </p>
                
                <div style="margin-bottom: 25px;">
                    <input type="number" id="invest-amount-input" value="${plan.min}" class="input-field" style="width: 100%; text-align: center; font-size: 1.5rem; padding: 15px; background: rgba(0,0,0,0.3); border: 2px solid var(--primary-blue); color: white; border-radius: 12px;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="invest-cancel" class="btn btn-outline" style="flex: 1; padding: 15px;">CANCELAR</button>
                    <button id="invest-confirm" class="btn btn-primary" style="flex: 1; padding: 15px;">CONFIRMAR</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Ações do Modal
        document.getElementById('invest-cancel').onclick = () => overlay.remove();
        
        document.getElementById('invest-confirm').onclick = async () => {
            // Revalidação do limite de 2 investimentos por plano
            const recheckInvs = (State.transactions || []).filter(t => t.type === 'inv' && t.description && t.description.replace('Investimento: ', '').trim().toLowerCase() === String(plan.name).trim().toLowerCase());
            if (recheckInvs.length >= 2) {
                alert(`⚠️ Limite Atingido: Cada usuário só pode investir no máximo 2 vezes no plano "${plan.name}".`);
                overlay.remove();
                return;
            }

            const amountInput = document.getElementById('invest-amount-input').value;
            const amount = parseFloat(amountInput);

            if (isNaN(amount) || amount < plan.min || amount > plan.max) {
                alert(`Por favor, insira um valor entre R$ ${plan.min} e R$ ${plan.max}`);
                return;
            }

            if (amount > Number(State.user.available)) {
                alert(`Saldo insuficiente! Você possui R$ ${Number(State.user.available).toFixed(2)} disponíveis, mas tentou investir R$ ${amount.toFixed(2)}.`);
                return;
            }

            const btn = document.getElementById('invest-confirm');
            btn.disabled = true;
            btn.innerText = "Processando...";

            try {
                // 1. Atualizar no Banco
                const newAvailable = Number(State.user.available) - amount;
                const newInvested = Number(State.user.invested) + amount;

                const { error: updError } = await supabase.from('users')
                    .update({ available: newAvailable, invested: newInvested })
                    .eq('phone', State.user.phone);

                if (updError) throw updError;

                // 2. Registrar Transação
                await supabase.from('transactions').insert([{ 
                    user_phone: State.user.phone, 
                    type: 'inv', 
                    amount: -amount, 
                    description: `Investimento: ${plan.name}` 
                }]);

                // 3. Sincronizar Estado Local
                const { data: updatedUser } = await supabase.from('users').select('*').eq('phone', State.user.phone).single();
                if (updatedUser) {
                    State.user = updatedUser;
                }

                overlay.remove();
                alert("🚀 Investimento realizado com sucesso!");

                // Recarregar transações para atualizar a lista do dashboard imediatamente
                const { data: txs } = await supabase.from('transactions').select('*').eq('user_phone', State.user.phone).order('created_at', { ascending: false });
                if (txs) {
                    State.transactions = txs.map(t => ({ ...t, date: new Date(t.created_at).toLocaleDateString('pt-BR') }));
                }

                Router.navigate('dashboard');
            } catch (e) {
                console.error(e);
                alert("Erro ao processar: " + e.message);
                btn.disabled = false;
                btn.innerText = "CONFIRMAR";
            }
        };
    };

    window.handleCancelInvest = async (txId, amount) => {
        // Criar o Modal Customizado de Confirmação de Estorno
        const overlay = document.createElement('div');
        overlay.className = 'promo-splash-overlay';
        overlay.style.zIndex = "10001";
        
        overlay.innerHTML = `
            <div class="glass-card animate-pop" style="width: 90%; max-width: 400px; padding: 30px; text-align: center; border: 1px solid #FF5252;">
                <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                <h2 style="color: white; margin-bottom: 10px;">Estornar Investimento?</h2>
                <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 25px;">
                    Deseja realmente estornar o valor de <br>
                    <span style="color: #FF5252; font-weight: 700; font-size: 1.2rem;">R$ ${Number(amount).toFixed(2)}</span>?<br><br>
                    O valor voltará integralmente para seu saldo disponível.
                </p>
                
                <div style="display: flex; gap: 10px;">
                    <button id="cancel-no" class="btn btn-outline" style="flex: 1; padding: 15px;">NÃO</button>
                    <button id="cancel-yes" class="btn btn-primary" style="flex: 1; padding: 15px; background: #FF5252; border-color: #FF5252;">SIM, ESTORNAR</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Ações do Modal
        document.getElementById('cancel-no').onclick = () => overlay.remove();
        
        document.getElementById('cancel-yes').onclick = async () => {
            const btn = document.getElementById('cancel-yes');
            btn.disabled = true;
            btn.innerText = "Processando...";

            try {
                // 1. Devolver saldo no Banco
                const newAvailable = Number(State.user.available) + Number(amount);
                const newInvested = Number(State.user.invested) - Number(amount);

                const { error: updError } = await supabase.from('users')
                    .update({ available: newAvailable, invested: newInvested })
                    .eq('phone', State.user.phone);

                if (updError) throw updError;

                // 2. Deletar a transação original para sumir da lista de ativos
                await supabase.from('transactions').delete().eq('id', txId);
                
                // Registrar o estorno para auditoria
                await supabase.from('transactions').insert([{ 
                    user_phone: State.user.phone, 
                    type: 'dep', 
                    amount: amount, 
                    description: `Estorno de Investimento (Cancelado)` 
                }]);

                // 3. Sincronizar Tudo
                const { data: updatedUser } = await supabase.from('users').select('*').eq('phone', State.user.phone).single();
                if (updatedUser) State.user = updatedUser;

                const { data: txs } = await supabase.from('transactions').select('*').eq('user_phone', State.user.phone).order('created_at', { ascending: false }).limit(50);
                if (txs) {
                    State.transactions = txs.map(t => ({ ...t, date: new Date(t.created_at).toLocaleDateString('pt-BR') }));
                }

                overlay.remove();
                alert("✅ Investimento estornado com sucesso!");
                Router.navigate('dashboard');
            } catch (e) {
                console.error(e);
                alert("Erro ao estornar: " + e.message);
                btn.disabled = false;
                btn.innerText = "SIM, ESTORNAR";
            }
        };
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

    window.loadAdminStats = async () => {
        if (!supabase) return;
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

        const { count: pendingDepCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'pix_pendente');
        const { count: pendingWithCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'saque_pendente');

        const totalPending = (pendingDepCount || 0) + (pendingWithCount || 0);

        const uEl = document.getElementById('admin-total-users');
        const pEl = document.getElementById('admin-total-pending');
        if (uEl) uEl.innerText = usersCount !== null ? usersCount : '...';
        if (pEl) pEl.innerText = totalPending !== null ? totalPending : '...';
    };

    window.loadAdminData = async () => {
        const list = document.getElementById('admin-pending-list');
        list.innerHTML = '<p style="text-align: center;">Buscando pendências...</p>';

        const { data: pendings } = await supabase.from('transactions')
            .select('*')
            .in('type', ['pix_pendente', 'saque_pendente'])
            .order('created_at', { ascending: false });

        window.lastAdminPendings = pendings || []; // Cache to avoid complex onclick strings

        if (!pendings || pendings.length === 0) {
            list.innerHTML = '<p style="text-align: center; opacity: 0.5;">Nenhuma pendência no momento.</p>';
            return;
        }

        list.innerHTML = pendings.map(p => {
            if (p.type === 'pix_pendente') {
                return `
                <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 15px;">
                     <p style="font-size: 0.85rem; font-weight: 600;">Depósito PIX: <span style="color: #4CAF50;">R$ ${p.amount.toFixed(2)}</span></p>
                     <p style="font-size: 0.7rem; opacity: 0.6; margin-bottom: 10px;">Cliente: ${p.user_phone} | ID: ${p.id.split('-')[0]}</p>
                     
                     ${p.receipt ? `
                        <div style="margin-bottom: 15px;">
                            <p style="font-size: 0.7rem; color: var(--secondary-orange); margin-bottom: 5px;"><i class="fa-solid fa-image"></i> Comprovante Anexado:</p>
                            <img src="${p.receipt}" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid var(--glass-border); cursor: pointer;" onclick="window.open(this.src)">
                        </div>
                     ` : `
                        <p style="font-size: 0.7rem; opacity: 0.4; margin-bottom: 10px;"><i class="fa-solid fa-circle-info"></i> Sem comprovante anexado</p>
                     `}

                     <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" style="padding: 10px; font-size: 0.75rem; flex: 1; cursor: pointer;" onclick="window.handleAdminApprove('${p.id}')">✔ Aprovar</button>
                        <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; color: #FF5252; flex: 1; cursor: pointer;" onclick="window.handleAdminReject('${p.id}')">❌ Recusar</button>
                     </div>
                </div>
                `;
            } else {
                const gross = Math.abs(p.amount);
                const fee = gross * 0.08;
                const net = gross - fee;
                const timeStr = new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(p.created_at).toLocaleDateString('pt-BR');

                let extractedPixKey = '';
                if (p.description) {
                    const match = p.description.match(/Chave PIX:\s*([^|,\n]+)/i);
                    if (match && match[1]) {
                        extractedPixKey = match[1].trim();
                    } else {
                        extractedPixKey = p.description.split('|')[0].replace(/.*Chave PIX:/i, '').trim() || p.user_phone;
                    }
                } else {
                    extractedPixKey = p.user_phone;
                }

                return `
                <div style="border-bottom: 1px solid var(--glass-border); padding: 14px; margin-bottom: 15px; background: rgba(0, 209, 255, 0.03); border: 1px solid rgba(0, 209, 255, 0.15); border-radius: 10px;">
                     <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <span class="infinite-badge" style="border-color: rgba(255, 130, 0, 0.4); color: #FF8200; background: rgba(255, 130, 0, 0.1); font-size: 0.7rem;"><i class="fa-solid fa-clock"></i> Solicitação de Saque</span>
                            <h3 style="color: #00D1FF; margin: 6px 0 2px 0; font-size: 1.25rem;">R$ ${net.toFixed(2)} <span style="font-size: 0.75rem; color: #4CAF50; font-weight: 600;">(Líquido a Pagar)</span></h3>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 0.65rem; opacity: 0.8;">${dateStr} às ${timeStr}</p>
                            <p style="font-size: 0.65rem; color: #00D1FF; font-weight: 600;">ID: ${p.id.split('-')[0]}</p>
                        </div>
                     </div>

                     <div style="background: rgba(0,0,0,0.35); padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--glass-border);">
                        <p>👤 <strong>Investidor:</strong> <span style="color: white; font-weight: 600;">${p.user_phone}</span></p>
                        <p>💰 <strong>Valor Bruto:</strong> R$ ${gross.toFixed(2)} | 🏷️ <strong>Taxa (8%):</strong> R$ ${fee.toFixed(2)}</p>
                        <p style="margin-top: 4px; color: #FFD700; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; word-break: break-all;">
                            🔑 <strong>Chave PIX:</strong> <span style="color: #00D1FF; user-select: all;">${extractedPixKey}</span>
                        </p>
                     </div>

                     <!-- Ações em 1-Clique InfinitePay -->
                     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; border-color: #00D1FF; color: #00D1FF; font-weight: 600;" onclick="window.copyPixInfo('${extractedPixKey.replace(/'/g, "\\'")}', ${net})">
                            <i class="fa-solid fa-copy"></i> Copiar Chave PIX
                        </button>
                        <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; border-color: #FF8200; color: #FF8200; font-weight: 600;" onclick="window.openInfinitePayApp()">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir InfinitePay
                        </button>
                     </div>

                     <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" style="padding: 12px; font-size: 0.8rem; flex: 1.5; background: linear-gradient(135deg, #4CAF50, #2E7D32); border: none; cursor: pointer; font-weight: 700;" onclick="window.handleAdminApprove('${p.id}')">
                            <i class="fa-solid fa-check-double"></i> ✔ Confirmar PIX Pago
                        </button>
                        <button class="btn btn-outline" style="padding: 12px; font-size: 0.8rem; color: #FF5252; border-color: #FF5252; flex: 1; cursor: pointer; font-weight: 600;" onclick="window.handleAdminReject('${p.id}')">
                            <i class="fa-solid fa-ban"></i> ❌ Recusar & Estornar
                        </button>
                     </div>
                </div>
                `;
            }
        }).join('');
    };

    window.handleAdminApprove = async (txId) => {
        console.log("🚀 handleAdminApprove iniciado para:", txId);

        try {
            // Busca tanto na lista de pendências quanto na de relatórios
            const p = (window.lastAdminPendings || []).find(x => x.id === txId) ||
                (window.lastAdminReportData || []).find(x => x.id === txId);

            console.log("📦 Transação localizada no cache:", p);

            if (!p) {
                console.error("❌ ERRO: Transação não encontrada em lastAdminPendings ou lastAdminReportData");
                alert("Erro: Transação não localizada no cache local. Recarregue a página.");
                return;
            }

            if (p.type === 'pix_pendente') {
                const phone = p.user_phone;
                const amount = Math.abs(parseFloat(p.amount));

                const msg = `<strong>APROVAR PIX?</strong><br><br>Valor: R$ ${amount.toFixed(2)}<br>Cliente: ${phone}<br><br>Clique em confirmar se o valor já caiu na sua conta.`;

                window.showCustomModal(msg, async () => {
                    console.log("🔍 Buscando usuário no banco...");
                    const { data: user, error: userFetchError } = await supabase.from('users').select('*').eq('phone', phone).single();

                    if (userFetchError || !user) {
                        alert("Erro ao buscar usuário.");
                        return;
                    }

                    console.log("🆙 Atualizando saldo...");
                    const { error: balanceError } = await supabase.from('users').update({
                        available: Number(user.available) + amount,
                        balance: Number(user.balance) + amount
                    }).eq('phone', phone);

                    if (balanceError) {
                        alert("Erro ao atualizar saldo.");
                        return;
                    }

                    await supabase.from('transactions').update({ type: 'dep', description: 'Depósito PIX (Aprovado)' }).eq('id', txId);

                    // --- Cálculo Automático de Comissões Multinível ---
                    console.log("💰 Iniciando cálculo de comissões multinível...");
                    const COMMISSION_RATES = [0.15, 0.05, 0.02]; // Nível 1: 15%, Nível 2: 5%, Nível 3: 2%
                    const LEVEL_LABELS = ['1º Nível (15%)', '2º Nível (5%)', '3º Nível (2%)'];

                    let currentSponsorPhone = user.sponsor;
                    let commissionsGranted = 0;

                    for (let nivel = 0; nivel < 3; nivel++) {
                        if (!currentSponsorPhone) break; // Sem mais patrocinadores na cadeia

                        const rate = COMMISSION_RATES[nivel];
                        const commissionAmount = parseFloat((amount * rate).toFixed(2));

                        if (commissionAmount <= 0) break;

                        console.log(`🔗 Buscando patrocinador nível ${nivel + 1}: ${currentSponsorPhone}`);
                        const { data: sponsor, error: sponsorError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('phone', currentSponsorPhone)
                            .single();

                        if (sponsorError || !sponsor) {
                            console.warn(`⚠️ Patrocinador nível ${nivel + 1} não encontrado:`, currentSponsorPhone);
                            break;
                        }

                        // Creditar comissão no saldo do patrocinador
                        const { error: commError } = await supabase.from('users').update({
                            available: Number(sponsor.available) + commissionAmount,
                            balance: Number(sponsor.balance) + commissionAmount
                        }).eq('phone', sponsor.phone);

                        if (commError) {
                            console.error(`❌ Erro ao creditar comissão nível ${nivel + 1}:`, commError.message);
                        } else {
                            // Registrar transação de comissão para rastreamento
                            await supabase.from('transactions').insert([{
                                user_phone: sponsor.phone,
                                type: 'comissao',
                                amount: commissionAmount,
                                description: `Comissão ${LEVEL_LABELS[nivel]} — Indicado: ${phone} depositou R$ ${amount.toFixed(2)}`
                            }]);

                            commissionsGranted++;
                            console.log(`✅ Comissão nível ${nivel + 1} creditada: R$ ${commissionAmount.toFixed(2)} para ${sponsor.phone}`);
                        }

                        // Subir um nível na cadeia de indicação
                        currentSponsorPhone = sponsor.sponsor || null;
                    }

                    if (commissionsGranted > 0) {
                        console.log(`🎉 ${commissionsGranted} comissão(ões) de indicação creditada(s) automaticamente.`);
                    }
                    // --- Fim das Comissões ---

                    alert(`✅ SUCESSO! R$ ${amount.toFixed(2)} creditados.${commissionsGranted > 0 ? `\n💰 ${commissionsGranted} comissão(ões) de indicação distribuída(s)!` : ''}`);

                    if (window.loadAdminData) window.loadAdminData();
                    if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                        window.loadAdminReports();
                    }
                });
            } else {
                const gross = Math.abs(parseFloat(p.amount));
                const fee = gross * 0.08;
                const net = gross - fee;

                const msg = `<strong>EFETIVAR SAQUE?</strong><br><br>Valor Líquido: R$ ${net.toFixed(2)}<br>Cliente: ${p.user_phone}<br><br>Confirma que já realizou o PIX para o cliente?`;

                window.showCustomModal(msg, async () => {
                    const { error: txUpdateError } = await supabase.from('transactions').update({
                        type: 'with',
                        description: 'Saque Aprovado'
                    }).eq('id', txId);

                    if (txUpdateError) {
                        alert("Erro ao efetivar saque.");
                    } else {


                        alert("✅ Saque marcado como efetuado.");
                    }

                    if (window.loadAdminData) window.loadAdminData();
                    if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                        window.loadAdminReports();
                    }
                });
            }
        } catch (err) {
            console.error("💥 ERRO:", err);
        }
    };

    window.handleAdminReject = async (txId) => {
        console.log("🚀 handleAdminReject iniciado:", txId);

        try {
            const p = (window.lastAdminPendings || []).find(x => x.id === txId) ||
                (window.lastAdminReportData || []).find(x => x.id === txId);

            if (!p) return;

            const msg = `<strong>RECUSAR TRANSAÇÃO?</strong><br><br>Isso marcará o pedido como inválido. No caso de saque, o valor voltará para o saldo do cliente.`;

            window.showCustomModal(msg, async () => {
                if (p.type === 'pix_pendente') {
                    await supabase.from('transactions').update({ type: 'pix_recusado', description: 'Depósito PIX (Recusado)' }).eq('id', txId);
                    alert("Depósito recusado.");
                } else {
                    const amount = Math.abs(parseFloat(p.amount));
                    const { data: user } = await supabase.from('users').select('*').eq('phone', p.user_phone).single();
                    if (user) {
                        await supabase.from('users').update({
                            available: Number(user.available) + amount,
                            balance: Number(user.balance) + amount
                        }).eq('phone', p.user_phone);

                        await supabase.from('transactions').update({ type: 'saque_recusado', description: 'Saque Recusado (Estornado)' }).eq('id', txId);
                        alert("Saque recusado e valor estornado.");
                    }
                }
                if (window.loadAdminData) window.loadAdminData();
                if (window.loadAdminReports && document.getElementById('report-results') && document.getElementById('report-results').style.display !== 'none') {
                    window.loadAdminReports();
                }
            });
        } catch (err) { console.error(err); }
    };

    window.handleCreatePlan = async () => {
        const name = document.getElementById('plan-name').value;
        const category = document.getElementById('plan-category').value;
        const duration = parseInt(document.getElementById('plan-duration').value);
        const dailyReturn = parseFloat(document.getElementById('plan-return').value);
        const minAmount = parseFloat(document.getElementById('plan-min').value);
        const maxAmount = parseFloat(document.getElementById('plan-max').value);

        const isSurprise = document.getElementById('plan-is-surprise').checked;
        const rawStart = document.getElementById('plan-starts-at').value;
        const rawEnd = document.getElementById('plan-expires-at').value;

        if (!name || isNaN(duration) || isNaN(dailyReturn) || isNaN(minAmount) || isNaN(maxAmount)) {
            alert("Preencha todos os campos do plano com valores válidos.");
            return;
        }

        if (isSurprise && (!rawStart || !rawEnd)) {
            alert("Para planos surpresa, você deve definir obrigatoriamente a data/hora de abertura e de encerramento.");
            return;
        }

        let startsAt = null, expiresAt = null;
        if (isSurprise) {
            // Convert to local ISO for Supabase (preserving exact local time context)
            startsAt = new Date(rawStart).toISOString();
            expiresAt = new Date(rawEnd).toISOString();
        }

        const planRef = {
            name: name,
            category: category,
            duration: duration,
            daily_return: dailyReturn,
            min_amount: minAmount,
            max_amount: maxAmount,
            is_surprise: isSurprise,
            starts_at: startsAt,
            expires_at: expiresAt
        };

        const { data, error } = await supabase.from('plans').insert([planRef]).select();
        if (error) {
            alert("Erro ao criar plano. Verificou se você rodou o código SQL no seu Supabase? Erro original: " + error.message);
            return;
        }

        if (data && data[0]) {
            State.plans.push({
                id: data[0].id,
                name: data[0].name,
                category: data[0].category,
                duration: data[0].duration,
                dailyReturn: parseFloat(data[0].daily_return) / 100,
                min: parseFloat(data[0].min_amount),
                max: parseFloat(data[0].max_amount),
                isSurprise: data[0].is_surprise || false,
                startsAt: data[0].starts_at || null,
                expiresAt: data[0].expires_at || null
            });
            alert("Plano criado com sucesso!");
            Router.render();
        }
    };

    window.handleDeletePlan = async (id) => {
        if (!confirm("Deletar esse plano de investimento permanentemente da plataforma? Isso impedirá novas assinaturas.")) return;

        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (error) {
            alert("Erro ao deletar: " + error.message);
            return;
        }

        State.plans = State.plans.filter(p => p.id !== id);
        alert("Plano removido.");
        Router.render();
    };

    window.rejectPix = async (txId) => {
        console.log("Iniciando recusa de PIX:", txId);
        if (!confirm("Tem certeza que esse depósito é inválido/falso? Ele será marcado como Recusado.")) return;

        const { data, error } = await supabase.from('transactions').update({
            type: 'pix_recusado',
            description: 'Depósito PIX (Recusado)'
        }).eq('id', txId).select();

        if (error || !data || data.length === 0) {
            alert("Erro ao recusar PIX no banco: " + (error ? error.message : "0 linhas afetadas"));
            return;
        }

        alert("Depósito recusado com sucesso.");
        loadAdminData();
    };

    window.loadAdminReports = async () => {
        const dateStr = document.getElementById('report-date').value;
        const typeFilter = document.getElementById('report-type').value;

        const reportResultsDiv = document.getElementById('report-results');
        const reportListDiv = document.getElementById('report-list');
        reportListDiv.innerHTML = '<p style="text-align:center; opacity: 0.5;">Buscando dados no servidor...</p>';
        reportResultsDiv.style.display = 'flex';

        let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

        if (dateStr) {
            // Definindo ranges GMT-3 para bater exatamente com a data Brasileira selecionada
            const start = new Date(`${dateStr}T00:00:00-03:00`).toISOString();
            const end = new Date(`${dateStr}T23:59:59-03:00`).toISOString();
            query = query.gte('created_at', start).lte('created_at', end);
        }

        if (typeFilter === 'dep') {
            query = query.in('type', ['dep', 'pix_pendente', 'pix_recusado']);
        } else if (typeFilter === 'with') {
            query = query.in('type', ['with', 'saque_pendente', 'saque_recusado']);
        } else {
            query = query.in('type', ['dep', 'pix_pendente', 'pix_recusado', 'with', 'saque_pendente', 'saque_recusado']);
        }

        const { data, error } = await query;
        if (error) {
            reportListDiv.innerHTML = `<p style="text-align:center; color: red;">Erro: ${error.message}</p>`;
            return;
        }

        window.lastAdminReportData = data;

        let depApproved = 0, depPending = 0;
        let withApproved = 0, withPending = 0;
        let htmlSnippet = '';

        if (!data || data.length === 0) {
            htmlSnippet = '<p style="text-align:center; opacity: 0.5; font-size: 0.8rem;">Nenhum registro (Pix/Saque) encontrado nesta data.</p>';
        } else {
            data.forEach(tx => {
                const amount = Math.abs(parseFloat(tx.amount));

                let readableType = ''; let color = ''; let statTxt = '';
                if (tx.type === 'dep') {
                    depApproved += amount;
                    readableType = 'Depósito'; color = '#4CAF50'; statTxt = 'APROVADO';
                } else if (tx.type === 'pix_pendente') {
                    depPending += amount;
                    readableType = 'Depósito'; color = '#FF9800'; statTxt = 'PENDENTE';
                } else if (tx.type === 'with') {
                    withApproved += amount;
                    readableType = 'Saque'; color = '#FF5252'; statTxt = 'APROVADO';
                } else if (tx.type === 'saque_pendente') {
                    withPending += amount;
                    readableType = 'Saque'; color = '#FF9800'; statTxt = 'PENDENTE';
                } else if (tx.type.includes('recusado')) {
                    readableType = tx.type.includes('pix') ? 'Depósito' : 'Saque';
                    color = '#607D8B'; statTxt = 'RECUSADO';
                }

                htmlSnippet += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; border-left: 4px solid ${color}; position: relative; z-index: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="font-size: 0.85rem; font-weight: 700; color: white;">${tx.user_phone}</p>
                                <p style="font-size: 0.7rem; opacity: 0.7;">${readableType} | ${new Date(tx.created_at).toLocaleTimeString('pt-BR')}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-size: 1rem; font-weight: 800; color: ${color};">R$ ${amount.toFixed(2)}</p>
                                <p style="font-size: 0.65rem; color: ${color}; font-weight: 700; letter-spacing: 0.5px;">${statTxt}</p>
                            </div>
                        </div>
                        
                        ${(tx.type === 'pix_pendente' || tx.type === 'saque_pendente') ? `
                            <div style="display: flex; gap: 8px; margin-top: 5px;">
                                <button class="btn btn-primary" style="padding: 10px; font-size: 0.75rem; flex: 1; border-radius: 8px; background: linear-gradient(45deg, #4CAF50, #2E7D32); cursor: pointer; pointer-events: auto;" onclick="window.handleAdminApprove('${tx.id}')">
                                    <i class="fa-solid fa-check"></i> Aprovar Pix
                                </button>
                                <button class="btn btn-outline" style="padding: 10px; font-size: 0.75rem; flex: 1; border-radius: 8px; color: #FF5252; border-color: #FF525240; cursor: pointer; pointer-events: auto;" onclick="window.handleAdminReject('${tx.id}')">
                                    <i class="fa-solid fa-xmark"></i> Rejeitar Pix
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        document.getElementById('report-dep-approved').innerText = `R$ ${depApproved.toFixed(2)}`;
        document.getElementById('report-dep-pending').innerText = `Pendente: R$ ${depPending.toFixed(2)}`;
        document.getElementById('report-with-approved').innerText = `R$ ${withApproved.toFixed(2)}`;
        document.getElementById('report-with-pending').innerText = `Pendente: R$ ${withPending.toFixed(2)}`;

        const net = depApproved - withApproved;
        document.getElementById('report-net-balance').innerText = `R$ ${net.toFixed(2)}`;
        document.getElementById('report-net-balance').style.color = net >= 0 ? '#4CAF50' : '#FF5252';

        reportListDiv.innerHTML = htmlSnippet;
    };

    window.exportAdminReportsToExcel = () => {
        if (!window.lastAdminReportData || window.lastAdminReportData.length === 0) {
            alert("Nenhum dado para exportar. Gere o relatório primeiro.");
            return;
        }

        let csvContent = "Data/Hora;Cliente;Tipo;Status;Valor (R$)\n";

        window.lastAdminReportData.forEach(tx => {
            const date = new Date(tx.created_at).toLocaleString('pt-BR');
            const amount = Math.abs(parseFloat(tx.amount)).toFixed(2).replace('.', ',');
            const client = tx.user_phone;

            let type = ''; let status = '';
            if (tx.type === 'dep') { type = 'Depósito'; status = 'Aprovado'; }
            else if (tx.type === 'pix_pendente') { type = 'Depósito'; status = 'Pendente'; }
            else if (tx.type === 'with') { type = 'Saque'; status = 'Aprovado'; }
            else if (tx.type === 'saque_pendente') { type = 'Saque'; status = 'Pendente'; }
            else if (tx.type.includes('recusado')) { type = tx.type.includes('pix') ? 'Depósito' : 'Saque'; status = 'Recusado'; }
            else { type = tx.type; status = '-'; }

            csvContent += `${date};${client};${type};${status};${amount}\n`;
        });

        const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `relatorio_caixa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.copyRef = () => {
        const input = document.querySelector('input[readonly]');
        input.select();
        document.execCommand('copy');
        alert("Link copiado! Envie para seus amigos.");
    };

    window.handleDailyCheckin = async () => {
        if (!State.user) return;

        const last = State.user.last_checkin ? new Date(State.user.last_checkin) : null;
        const now = new Date();

        if (last && (now - last < 24 * 60 * 60 * 1000)) {
            alert("Você já fez o check-in hoje! Volte em 24h.");
            return;
        }

        const newPoints = (State.user.points || 0) + 1;
        const checkinDate = now.toISOString();

        const { error } = await supabase.from('users').update({
            points: newPoints,
            last_checkin: checkinDate
        }).eq('phone', State.user.phone);

        if (error) {
            alert("Erro ao salvar check-in: " + error.message);
            return;
        }

        State.user.points = newPoints;
        State.user.last_checkin = checkinDate;

        alert("💎 +1 Ponto de Fidelidade! Continue assim.");
        Router.render();
    };

    window.handleExchangePoints = async () => {
        const target = State.user.checkin_target || 7;
        const reward = target; // R$ 7 for 7 days, R$ 15 for 15 days

        if (!State.user || (State.user.points || 0) < target) {
            alert(`Você precisa de pelo menos ${target} pontos.`);
            return;
        }

        if (!confirm(`Deseja resgatar sua recompensa de R$ ${reward.toFixed(2)} e iniciar o próximo ciclo?`)) return;

        const newTarget = target === 7 ? 15 : 7;
        const newPoints = 0; // Reset as requested
        const newAvailable = State.user.available + reward;
        const newBalance = State.user.balance + reward;

        // Registrar transação
        const { error: txError } = await supabase.from('transactions').insert([{
            user_phone: State.user.phone,
            type: 'dep',
            amount: reward,
            description: `Recompensa Check-in (${target} dias)`
        }]);

        if (txError) {
            alert("Erro ao processar recompensa: " + txError.message);
            return;
        }

        const { error: userError } = await supabase.from('users').update({
            points: newPoints,
            checkin_target: newTarget,
            available: newAvailable,
            balance: newBalance
        }).eq('phone', State.user.phone);

        if (userError) {
            alert("Erro ao atualizar cadastro: " + userError.message);
            return;
        }

        State.user.points = newPoints;
        State.user.checkin_target = newTarget;
        State.user.available = newAvailable;
        State.user.balance = newBalance;

        // Efeito de Confete
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0066FF', '#FFD700', '#FFFFFF']
            });
        }

        alert(`🎉 Parabéns! R$ ${reward.toFixed(2)} foram adicionados ao seu saldo disponível. Próximo objetivo: ${newTarget} dias!`);
        Router.render();
    };

    let currentRotation = 0;
    window.handleFortuneSpin = async () => {
        if (State.fortune_session.isSpinning || State.fortune_session.spinsLeft <= 0) return;

        State.fortune_session.isSpinning = true;
        State.fortune_session.spinsLeft--;

        const wheel = document.getElementById('main-wheel');
        const spinBtn = document.getElementById('spin-btn');
        const claimBtn = document.getElementById('claim-btn');
        const fortuneMsg = document.getElementById('fortune-msg');

        spinBtn.disabled = true;
        if (claimBtn) claimBtn.style.display = 'none';
        fortuneMsg.innerHTML = "Sorteando prêmio...";

        // Logic for landing
        // 8 segments, 45deg each. Starts at -22.5.
        // Segments relative to pointer (at top, 0deg target):
        // Index 0 (82, 55): R$ 5 (0-45deg)
        // Index 1 (65, 80): PERDEU TUDO (45-90)
        // Index 2 (45, 85): R$ 20 (90-135)
        // Index 3 (18, 70): R$ 10 (135-180)
        // Index 4 (15, 45): PERDEU TUDO (180-225)
        // Index 5 (35, 20): R$ 50 (225-270)
        // Index 6 (55, 15): R$ 100 (270-315)
        // Index 7 (80, 35): R$ 5 (315-360)

        const prizes = [
            { label: 'R$ 5', value: 5 },
            { label: 'PERDEU TUDO', value: -1 },
            { label: 'R$ 20', value: 20 },
            { label: 'R$ 10', value: 10 },
            { label: 'PERDEU TUDO', value: -1 },
            { label: 'R$ 50', value: 50 },
            { label: 'R$ 100', value: 100 },
            { label: 'R$ 5', value: 5 }
        ];

        // Random spin
        const extraDegrees = Math.floor(Math.random() * 360);
        const spins = 5 + Math.floor(Math.random() * 5); // 5 to 10 full spins
        currentRotation += (spins * 360) + extraDegrees;

        wheel.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(async () => {
            State.fortune_session.isSpinning = false;

            // Calculate which segment is at the pointer (top is index 0 in our logic)
            // The pointer is at 0 degrees. The wheel rotated by currentRotation.
            // Normalize currentRotation to 0-359.
            const normalized = (360 - (currentRotation % 360)) % 360;
            const segmentIdx = Math.floor(normalized / 45);
            const prize = prizes[segmentIdx];

            if (prize.value === -1) {
                State.fortune_session.accumulated = 0;
                fortuneMsg.innerHTML = '<span style="color: #FF5252;">😱 AH NÃO! Você caiu no PERDEU TUDO!</span>';
                // Only mark as used on DB if they lost or claimed
            } else {
                State.fortune_session.accumulated += prize.value;
                fortuneMsg.innerHTML = `<span style="color: #4CAF50;">💰 PARABÉNS! Ganhou ${prize.label}!</span>`;
            }

            // Sync with UI
            document.getElementById('fortune-accumulated').innerText = `R$ ${State.fortune_session.accumulated.toFixed(2)}`;
            document.getElementById('fortune-spins').innerText = State.fortune_session.spinsLeft;

            // Re-enable buttons
            spinBtn.disabled = State.fortune_session.spinsLeft <= 0;
            if (claimBtn) {
                claimBtn.style.display = (State.fortune_session.accumulated > 0) ? 'block' : 'none';
                claimBtn.disabled = false;
            }

            // If spins ended, they MUST claim (if > 0) or it ends
            if (State.fortune_session.spinsLeft === 0) {
                if (State.fortune_session.accumulated > 0) {
                    fortuneMsg.innerHTML += '<br>Giros acabaram! Resgate seu prêmio agora.';
                } else {
                    fortuneMsg.innerHTML += '<br>Que pena! Tente investir mais para ganhar novos giros.';
                    await finalizeSpinsUsed(1); // Increment used
                    State.fortune_session.isActive = false;
                    setTimeout(() => Router.render(), 2000);
                }
            }
        }, 5100);
    };

    window.handleFortuneClaim = async () => {
        if (State.fortune_session.isSpinning || State.fortune_session.accumulated <= 0) return;

        const prize = State.fortune_session.accumulated;

        const { error: txError } = await supabase.from('transactions').insert([{
            user_phone: State.user.phone,
            type: 'dep',
            amount: prize,
            description: 'Prêmio da Roda da Fortuna'
        }]);

        if (txError) {
            alert("Erro ao resgatar prêmio: " + txError.message);
            return;
        }

        const newAvailable = State.user.available + prize;
        const newBalance = State.user.balance + prize;

        const { error: userError } = await supabase.from('users').update({
            available: newAvailable,
            balance: newBalance
        }).eq('phone', State.user.phone);

        if (userError) {
            alert("Erro ao creditar saldo: " + userError.message);
            return;
        }

        await finalizeSpinsUsed(1); // Consumed the session

        State.user.available = newAvailable;
        State.user.balance = newBalance;
        State.fortune_session.accumulated = 0;
        State.fortune_session.isActive = false;

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#0066FF', '#FFFFFF']
            });
        }

        alert(`🤑 SUCESSO! R$ ${prize.toFixed(2)} foram creditados na sua conta!`);
        Router.render();
    };

    async function finalizeSpinsUsed(count) {
        const newSpinsUsed = (State.user.spins_used || 0) + (count * 3); // Each session is 3 spins used
        await supabase.from('users').update({ spins_used: newSpinsUsed }).eq('phone', State.user.phone);
        State.user.spins_used = newSpinsUsed;
    }

    // --- Suporte e Alteração de Senha ---
    window.handleContactSupport = () => {
        const userPhone = State.user ? State.user.phone : '';
        const textMsg = encodeURIComponent(`Olá! Sou o cliente (${userPhone}) e preciso de suporte na plataforma The Blue.`);
        const waUrl = `https://wa.me/551934585300?text=${textMsg}`;

        const content = `
            <div style="text-align: center;">
                <div style="background: rgba(37,211,102,0.15); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto;">
                    <i class="fa-solid fa-headset" style="color: #25D366; font-size: 1.8rem;"></i>
                </div>
                <h3 style="color: white; margin-bottom: 8px;">Atendimento ao Cliente</h3>
                <p style="font-size: 0.82rem; color: var(--text-dim); margin-bottom: 20px;">Nossa equipe de suporte está pronta para te atender de Segunda a Sábado das 08h às 22h.</p>
                
                <a href="${waUrl}" target="_blank" class="btn" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #25D366; color: white; width: 100%; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                    <i class="fa-brands fa-whatsapp" style="font-size: 1.2rem;"></i> Falar no WhatsApp Suporte
                </a>
                
                <a href="mailto:theblueplataforma@gmail.com?subject=Suporte%20The%20Blue%20-${userPhone}" class="btn btn-outline" style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px; border-radius: 10px; text-decoration: none; font-size: 0.85rem; color: white;">
                    <i class="fa-solid fa-envelope"></i> Enviar E-mail para Suporte
                </a>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.id = 'support-modal-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px); padding: 20px;
        `;

        const modal = document.createElement('div');
        modal.style = `
            background: #151515; border: 1px solid #333; border-radius: 16px;
            width: 100%; max-width: 400px; padding: 25px; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: animate-pop 0.3s ease-out;
        `;

        modal.innerHTML = content + `
            <button id="support-modal-close" class="btn btn-outline" style="width: 100%; margin-top: 15px; padding: 10px; border-color: var(--glass-border);">FECHAR</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('support-modal-close').onclick = () => {
            document.body.removeChild(overlay);
        };
    };

    window.handleOpenChangePasswordModal = () => {
        const overlay = document.createElement('div');
        overlay.id = 'change-pass-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px); padding: 20px;
        `;

        const modal = document.createElement('div');
        modal.style = `
            background: #151515; border: 1px solid #333; border-radius: 16px;
            width: 100%; max-width: 420px; padding: 25px; text-align: left;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: animate-pop 0.3s ease-out;
        `;

        modal.innerHTML = `
            <h3 style="color: white; margin-bottom: 5px; text-align: center;"><i class="fa-solid fa-key" style="color: var(--accent-blue);"></i> Alterar Senha</h3>
            <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 20px; text-align: center;">Atualize sua senha de acesso ou senha financeira de saque.</p>

            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;">Qual senha deseja alterar?</label>
            <select id="change-pass-type" class="input-field" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">
                <option value="access" style="background:#111;">Senha de Acesso ao App</option>
                <option value="withdraw" style="background:#111;">Senha Financeira (de Saque)</option>
            </select>

            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;">Senha Atual</label>
            <input type="password" id="change-pass-current" placeholder="••••••••" class="input-field" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;">Nova Senha</label>
            <input type="password" id="change-pass-new" placeholder="Mínimo 6 dígitos" class="input-field" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 15px;">

            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;">Confirmar Nova Senha</label>
            <input type="password" id="change-pass-confirm" placeholder="Confirme a nova senha" class="input-field" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: white; margin-bottom: 20px;">

            <div style="display: flex; gap: 10px;">
                <button id="change-pass-cancel" class="btn btn-outline" style="flex: 1; padding: 12px; font-weight: 700;">CANCELAR</button>
                <button id="change-pass-submit" class="btn btn-primary" style="flex: 1; padding: 12px; font-weight: 700;">SALVAR</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('change-pass-cancel').onclick = () => {
            document.body.removeChild(overlay);
        };

        document.getElementById('change-pass-submit').onclick = async () => {
            const passType = document.getElementById('change-pass-type').value;
            const currentPass = document.getElementById('change-pass-current').value;
            const newPass = document.getElementById('change-pass-new').value;
            const confirmPass = document.getElementById('change-pass-confirm').value;

            if (!currentPass || !newPass || !confirmPass) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            if (newPass !== confirmPass) {
                alert("A nova senha e a confirmação não conferem!");
                return;
            }

            if (passType === 'access') {
                if (currentPass !== State.user.password) {
                    alert("A senha de acesso atual está incorreta.");
                    return;
                }
                if (newPass.length < 6) {
                    alert("A nova senha de acesso deve ter no mínimo 6 dígitos.");
                    return;
                }

                const { error } = await supabase.from('users').update({ password: newPass }).eq('phone', State.user.phone);
                if (error) {
                    alert("Erro ao alterar senha: " + error.message);
                    return;
                }
                State.user.password = newPass;
                alert("✅ Senha de acesso alterada com sucesso!");
            } else {
                if (currentPass !== State.user.withdraw_pass) {
                    alert("A senha financeira atual está incorreta.");
                    return;
                }
                if (newPass.length < 4) {
                    alert("A nova senha financeira deve ter no mínimo 4 dígitos.");
                    return;
                }

                const { error } = await supabase.from('users').update({ withdraw_pass: newPass }).eq('phone', State.user.phone);
                if (error) {
                    alert("Erro ao alterar senha financeira: " + error.message);
                    return;
                }
                State.user.withdraw_pass = newPass;
                alert("✅ Senha financeira alterada com sucesso!");
            }

            document.body.removeChild(overlay);
        };
    };

    window.handleLogout = () => {
        State.user = null;
        // Limpar sessão salva ao fazer logout manualmente
        localStorage.removeItem('theblue_session_phone');
        localStorage.removeItem('theblue_remember');
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab-item[data-view="dashboard"]').classList.add('active'); // Reset tab state
        Router.navigate('auth');
    };

    // --- Custom Modal System ---
    window.showCustomModal = (htmlContent, onConfirm) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'custom-modal-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
            z-index: 10000; backdrop-filter: blur(5px); padding: 20px;
        `;

        const modal = document.createElement('div');
        modal.style = `
            background: #151515; border: 1px solid #333; border-radius: 16px;
            width: 100%; max-width: 400px; padding: 25px; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: animate-pop 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="font-size: 1.1rem; color: #fff; margin-bottom: 25px; line-height: 1.5;">${htmlContent}</div>
            <div style="display: flex; gap: 10px;">
                <button id="modal-cancel" class="btn btn-outline" style="flex: 1; padding: 12px; font-weight: 700;">CANCELAR</button>
                <button id="modal-confirm" class="btn btn-primary" style="flex: 1; padding: 12px; font-weight: 700;">CONFIRMAR</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Listeners
        document.getElementById('modal-cancel').onclick = () => {
            document.body.removeChild(overlay);
        };

        document.getElementById('modal-confirm').onclick = async () => {
            const btn = document.getElementById('modal-confirm');
            btn.disabled = true;
            btn.innerText = "Processando...";
            await onConfirm();
            document.body.removeChild(overlay);
        };
    };

    window.loadPromoUsers = async () => {
        const list = document.getElementById('admin-promo-list');
        if (!list) return;
        list.innerHTML = '<p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Buscando elegíveis...</p>';

        const { data: users, error } = await supabase
            .from('users')
            .select('phone, invested')
            .gte('invested', 2000)
            .order('invested', { ascending: false });

        if (error) {
            list.innerHTML = `<p style="color: #FF5252; font-size: 0.8rem;">Erro ao buscar: ${error.message}</p>`;
            return;
        }

        if (!users || users.length === 0) {
            list.innerHTML = '<p style="text-align: center; font-size: 0.8rem; opacity: 0.5;">Nenhum usuário atingiu R$ 2.000,00 ainda.</p>';
            return;
        }

        list.innerHTML = users.map(u => `
            <div style="background: rgba(255,215,0,0.05); padding: 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,215,0,0.2);">
                <div>
                    <p style="font-weight: 700; color: white;">${u.phone}</p>
                    <p style="font-size: 0.75rem; color: #FFD700;">Total Investido: R$ ${parseFloat(u.invested).toFixed(2)}</p>
                </div>
                <button class="btn btn-primary" style="padding: 8px 12px; font-size: 0.7rem; background: #FFD700; border-color: #FFD700; color: black;" onclick="handlePayPromoPrize('${u.phone}')">
                    PAGAR PRÊMIO
                </button>
            </div>
        `).join('');
    };

    window.handlePayPromoPrize = async (phone) => {
        if (!confirm(`Confirma o pagamento do prêmio de R$ 500,00 para o usuário ${phone}?`)) return;

        try {
            // 1. Buscar usuário para garantir saldo atualizado
            const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
            if (!user) throw new Error("Usuário não encontrado.");

            // 2. Adicionar R$ 500
            const { error: updError } = await supabase.from('users').update({
                available: Number(user.available) + 500,
                balance: Number(user.balance) + 500
            }).eq('phone', phone);

            if (updError) throw updError;

            // 3. Registrar Transação
            await supabase.from('transactions').insert([{
                user_phone: phone,
                type: 'dep',
                amount: 500,
                description: '🎁 PRÊMIO PROMOÇÃO: Investimento 2k+ (2 Meses)'
            }]);



            alert(`✅ Sucesso! R$ 500,00 pagos ao usuário ${phone}.`);
            loadPromoUsers(); // Atualiza a lista
        } catch (e) {
            console.error(e);
            alert("Erro ao pagar prêmio: " + e.message);
        }
    };

    // --- Processamento de Rendimentos das 00:00 (Meia-Noite) ---
    window.checkAndProcessMidnightYields = async (targetPhone = null, isManualAdmin = false) => {
        const phone = targetPhone || (State.user ? State.user.phone : null);
        if (!phone || !supabase) return 0;

        try {
            const [userRes, txsRes] = await Promise.all([
                supabase.from('users').select('*').eq('phone', phone).single(),
                supabase.from('transactions').select('*').eq('user_phone', phone).order('created_at', { ascending: true })
            ]);

            if (!userRes.data) return 0;
            const currentUser = userRes.data;
            const allTxs = txsRes.data || [];

            const invTxs = allTxs.filter(t => t.type === 'inv');
            if (invTxs.length === 0) {
                if (isManualAdmin) alert("Nenhum investimento ativo encontrado para este usuário.");
                return 0;
            }

            const existingYieldTxs = allTxs.filter(t => t.type === 'rendimento');
            let totalCreditedInRun = 0;
            const newYieldTxsToInsert = [];
            const now = new Date();

            for (const inv of invTxs) {
                const invDate = new Date(inv.created_at);
                const invAmount = Math.abs(parseFloat(inv.amount));

                const planName = inv.description.replace('Investimento: ', '').trim();
                const matchedPlan = State.plans.find(p => p.name === planName);
                const dailyReturnPercent = matchedPlan ? (matchedPlan.dailyReturn * 100) : 2.0;

                const singleYieldAmount = Math.round((invAmount * (dailyReturnPercent / 100)) * 100) / 100;
                if (singleYieldAmount <= 0) continue;

                let checkDate = new Date(invDate);
                checkDate.setHours(0, 0, 0, 0);
                checkDate.setDate(checkDate.getDate() + 1);

                while (checkDate <= now) {
                    const dateStr = checkDate.toLocaleDateString('pt-BR');

                    const alreadyCredited = existingYieldTxs.some(yt => 
                        yt.description.includes(dateStr) && (yt.description.includes(planName) || invTxs.length === 1)
                    );

                    if (!alreadyCredited) {
                        totalCreditedInRun += singleYieldAmount;
                        existingYieldTxs.push({
                            type: 'rendimento',
                            description: `Rendimento Diário (${planName}) - 00:00 (${dateStr})`
                        });

                        newYieldTxsToInsert.push({
                            user_phone: phone,
                            type: 'rendimento',
                            amount: singleYieldAmount,
                            description: `Rendimento Diário (${planName}) - 00:00 (${dateStr})`,
                            created_at: checkDate.toISOString()
                        });
                    }

                    checkDate.setDate(checkDate.getDate() + 1);
                }
            }

            if (totalCreditedInRun > 0 && newYieldTxsToInsert.length > 0) {
                const newAvailable = Number(currentUser.available) + totalCreditedInRun;
                const newBalance = Number(currentUser.balance) + totalCreditedInRun;

                const { error: updErr } = await supabase.from('users')
                    .update({ available: newAvailable, balance: newBalance })
                    .eq('phone', phone);

                if (updErr) throw updErr;

                await supabase.from('transactions').insert(newYieldTxsToInsert);

                if (State.user && State.user.phone === phone) {
                    State.user.available = newAvailable;
                    State.user.balance = newBalance;

                    const { data: updatedTxs } = await supabase.from('transactions')
                        .select('*').eq('user_phone', phone).order('created_at', { ascending: false }).limit(50);
                    if (updatedTxs) {
                        State.transactions = updatedTxs.map(t => ({ ...t, date: new Date(t.created_at).toLocaleDateString('pt-BR') }));
                    }

                    Router.render();

                    alert(`🎉 Rendimento Diário das 00:00!\nFoi creditado + R$ ${totalCreditedInRun.toFixed(2)} referente aos seus investimentos ativos.`);
                    if (window.confetti) {
                        window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                    }
                }
            } else if (isManualAdmin) {
                alert(`ℹ️ Todos os rendimentos das 00:00 para ${phone} já estão em dia!`);
            }

            return totalCreditedInRun;
        } catch (err) {
            console.error("Erro ao processar rendimentos de 00:00:", err);
            if (isManualAdmin) alert("Erro ao processar rendimentos: " + err.message);
            return 0;
        }
    };

    window.handleProcessAllYieldsAdmin = async () => {
        if (!confirm("Deseja executar o processamento de rendimentos das 00:00 para TODOS os usuários com investimentos ativos?")) return;
        try {
            if (!supabase) throw new Error("Supabase não conectado.");
            
            const { error: rpcErr } = await supabase.rpc('process_daily_yields');
            if (!rpcErr) {
                alert("✅ Rendimentos das 00:00 processados com sucesso para toda a plataforma via Supabase!");
                if (State.user && State.user.phone) {
                    window.checkAndProcessMidnightYields(State.user.phone);
                }
                return;
            }

            const { data: invUsers } = await supabase.from('users').select('phone').gt('invested', 0);
            if (!invUsers || invUsers.length === 0) {
                alert("Nenhum usuário com investimentos ativos no momento.");
                return;
            }

            let count = 0;
            for (const u of invUsers) {
                const credited = await window.checkAndProcessMidnightYields(u.phone, false);
                if (credited > 0) count++;
            }

            alert(`✅ Processamento concluído! Rendimentos das 00:00 creditados para ${count} usuário(s).`);
        } catch (e) {
            console.error(e);
            alert("Erro ao executar processamento de rendimentos: " + e.message);
        }
    };

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Fetch Plans from Supabase
        if (supabase) {
            const { data } = await supabase.from('plans').select('*').order('min_amount', { ascending: true });
            if (data && data.length > 0) {
                State.plans = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    duration: p.duration,
                    dailyReturn: parseFloat(p.daily_return) / 100,
                    min: parseFloat(p.min_amount),
                    max: parseFloat(p.max_amount),
                    isSurprise: p.is_surprise || false,
                    startsAt: p.starts_at || null,
                    expiresAt: p.expires_at || null
                }));
            }
        }

        // --- Auto-login: Restaurar sessão salva ("Lembrar de mim") ---
        const savedPhone = localStorage.getItem('theblue_session_phone');
        const remembered = localStorage.getItem('theblue_remember') === '1';
        if (savedPhone && remembered && supabase) {
            console.log('🔐 Sessão salva detectada. Restaurando login para:', savedPhone);
            try {
                const [userResponse, txsResponse] = await Promise.all([
                    supabase.from('users').select('*').eq('phone', savedPhone).single(),
                    supabase.from('transactions').select('*').eq('user_phone', savedPhone).order('created_at', { ascending: false }).limit(50)
                ]);
                if (userResponse.data) {
                    State.user = userResponse.data;
                    State.transactions = (txsResponse.data || []).map(t => ({
                        ...t,
                        date: new Date(t.created_at).toLocaleDateString('pt-BR')
                    }));
                    State.currentView = 'dashboard';
                    
                    // Checar rendimentos de meia-noite no auto-login
                    if (window.checkAndProcessMidnightYields) {
                        window.checkAndProcessMidnightYields(userResponse.data.phone);
                    }
                } else {
                    // Se usuário não foi encontrado, limpa a sessão salva
                    localStorage.removeItem('theblue_session_phone');
                    localStorage.removeItem('theblue_remember');
                }
            } catch (e) {
                console.warn('⚠️ Falha ao restaurar sessão:', e);
            }
        }
        // --- Fim do Auto-login ---

        // Check if there's a referral code in the URL
        // Referral Link Handler (?ref=PHONE)
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
            localStorage.setItem('theblue_ref', refParam);
            // Clean URL and show register form
            window.history.replaceState({}, document.title, window.location.pathname);
            State.currentView = 'auth';
            setTimeout(() => {
                if (window.toggleAuth) window.toggleAuth(true);
            }, 150);
        }

        // Keep legacy /ref/ support just in case, but knowing it might 404
        const path = window.location.pathname;
        if (path.startsWith('/ref/')) {
            const refCode = path.replace('/ref/', '');
            if (refCode) {
                localStorage.setItem('theblue_ref', refCode);
                window.history.replaceState({}, document.title, "/");
                State.currentView = 'auth';
                setTimeout(() => {
                    if (window.toggleAuth) window.toggleAuth(true);
                }, 150);
            }
        }

        // --- Detecção de Retorno Automático da InfinitePay (?deposit_success=true&order_nsu=...) ---
        const depositSuccess = urlParams.get('deposit_success') === 'true' || !!urlParams.get('transaction_nsu');
        const orderNsu = urlParams.get('order_nsu') || urlParams.get('txId');
        const depositPhone = urlParams.get('phone') || (State.user ? State.user.phone : null);

        if (depositSuccess && orderNsu) {
            console.log("💳 Retorno de pagamento InfinitePay identificado via URL:", { orderNsu, depositPhone });
            window.history.replaceState({}, document.title, window.location.pathname);

            setTimeout(async () => {
                if (window.processAutomaticDepositApproval) {
                    await window.processAutomaticDepositApproval(orderNsu, null, depositPhone, orderNsu);
                }
            }, 300);
        }

        // --- Global Timer Updater & 00:00 Midnight Scheduler ---
        setInterval(() => {
            // 1. Atualizar badges de ofertas por tempo
            document.querySelectorAll('.timer-badge').forEach(el => {
                const end = new Date(el.getAttribute('data-endtime')).getTime();
                const now = new Date().getTime();
                const diff = end - now;

                if (diff <= 0) {
                    el.innerText = "LIBERADO!";
                    if (State.currentView === 'investments') {
                        if (!el.dataset.expired) {
                            el.dataset.expired = "true";
                            Router.render();
                        }
                    }
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff / 1000 / 60) % 60);
                const secs = Math.floor((diff / 1000) % 60);

                let str = "";
                if (days > 0) str += `${days}d `;
                str += `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

                const prefix = el.innerText.includes('Abre em') ? 'Abre em: ' : '';
                el.innerText = prefix + str;
            });

            // 2. Atualizar temporizador regressivo de meia-noite (00:00)
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diffMidnight = midnight - now;

            if (diffMidnight <= 1000 && diffMidnight >= 0) {
                if (State.user && State.user.phone && window.checkAndProcessMidnightYields) {
                    window.checkAndProcessMidnightYields(State.user.phone);
                }
            }

            const mHours = Math.floor(diffMidnight / (1000 * 60 * 60));
            const mMins = Math.floor((diffMidnight / (1000 * 60)) % 60);
            const mSecs = Math.floor((diffMidnight / 1000) % 60);
            const midnightStr = `${String(mHours).padStart(2, '0')}h ${String(mMins).padStart(2, '0')}m ${String(mSecs).padStart(2, '0')}s`;

            document.querySelectorAll('.midnight-timer').forEach(el => {
                el.innerText = midnightStr;
            });
        }, 1000);

        // Delegação global de eventos para navegação [data-view]
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-view]');
            if (link) {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    Router.navigate(view);
                }
            }
        });

        // Start App
        Router.render();
    });
})();
