
(function(){
 const main=document.getElementById('home'),notice=main.querySelector('.notice'),heading=main.querySelector('.heading'),metrics=main.querySelector('.grid4'),homePremium=document.getElementById('homePremium');
 const marketSnapshot=document.getElementById('marketSnapshot'),profitChart=document.getElementById('profitChart'),markets=document.getElementById('markets'),trade=document.getElementById('trade'),wallet=document.getElementById('wallet'),security=main.querySelector('aside .card:last-child');
 const layout=main.querySelector('.layout'),pages={};
 function page(id,title){const el=document.createElement('section');el.id='page-'+id;el.className='app-page';if(id!=='home')el.innerHTML='<div class="heading"><h1>'+title+'</h1></div>';main.appendChild(el);pages[id]=el;return el}
 const home=page('home','Home');home.append(notice,heading,metrics,homePremium);
 page('markets','Markets').append(markets);
 page('trade','Trade').append(trade);
 const buyLivePage=page('buy-live','Buy Live Trading');buyLivePage.dataset.liveSide='Buy';
 const sellLivePage=page('sell-live','Sell Live Trading');sellLivePage.dataset.liveSide='Sell';
 page('charts','Charts').append(marketSnapshot,profitChart);page('wallet','Assets').append(wallet,security);
 const successPage=page('trade-success','Order Successful');
 successPage.innerHTML='<div class="card" style="max-width:560px;margin:34px auto;text-align:center;padding:34px 22px"><div aria-hidden="true" style="width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#143c34;color:#62e3b8;font-size:42px;font-weight:900">✓</div><h2 style="font-size:25px;margin:0 0 10px;color:#62e3b8">Success</h2><p id="tradeSuccessMessage" class="muted" style="margin:0 0 22px">Your order has been completed successfully.</p><button type="button" class="btn-blue wide" onclick="openNavPanel(&quot;home&quot;)">Confirm</button></div>';
 layout.remove();
 const links=[...document.querySelectorAll('.mobile-bottom-nav a')];
 function openPage(id){
   if(!pages[id])id='home';
   if(id==='buy-live'){pages[id].append(trade);document.getElementById('tradeOrderButton').textContent='Buy Now';}
   else if(id==='sell-live'){pages[id].append(trade);document.getElementById('tradeOrderButton').textContent='Sell Now';}
   else if(id==='trade'){pages.trade.append(trade);document.getElementById('tradeOrderButton').textContent='Order';}
   Object.entries(pages).forEach(([k,v])=>v.classList.toggle('active-page',k===id));links.forEach(a=>a.classList.toggle('active',a.dataset.navTarget===id));history.replaceState(null,'',id==='home'?location.pathname+location.search:'#'+id);window.scrollTo(0,0);if(id==='markets')window.loadMarkets?.()
 }
 window.showTradeSuccess=function(message){const el=document.getElementById('tradeSuccessMessage');if(el)el.textContent=message;openPage('trade-success')};
 links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openPage(a.dataset.navTarget)}));
 document.querySelectorAll('.top .nav a').forEach(a=>a.addEventListener('click',e=>{const id=(a.getAttribute('href')||'').slice(1);if(['markets','trade','wallet'].includes(id)){e.preventDefault();openPage(id)}}));
 window.openNavPanel=openPage;window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSupport();closeAccountPanel();closeCoinDetail();openPage('home')}});window.addEventListener('popstate',()=>openPage('home'));openPage('home');
})();

const coinList=[
 ['bitcoin','Bitcoin','BTC'],['ethereum','Ethereum','ETH'],['tether','Tether','USDT'],['binancecoin','BNB','BNB'],['solana','Solana','SOL'],['ripple','XRP','XRP'],['usd-coin','USDC','USDC'],['dogecoin','Dogecoin','DOGE'],['tron','TRON','TRX'],['the-open-network','Toncoin','TON'],
 ['cardano','Cardano','ADA'],['avalanche-2','Avalanche','AVAX'],['shiba-inu','Shiba Inu','SHIB'],['chainlink','Chainlink','LINK'],['polkadot','Polkadot','DOT'],['bitcoin-cash','Bitcoin Cash','BCH'],['litecoin','Litecoin','LTC'],['stellar','Stellar','XLM'],['near','NEAR Protocol','NEAR'],['uniswap','Uniswap','UNI'],
 ['internet-computer','Internet Computer','ICP'],['aptos','Aptos','APT'],['arbitrum','Arbitrum','ARB'],['optimism','Optimism','OP'],['cosmos','Cosmos','ATOM'],['filecoin','Filecoin','FIL'],['hedera-hashgraph','Hedera','HBAR'],['vechain','VeChain','VET'],['render-token','Render','RENDER'],['pepe','Pepe','PEPE'],['ethereum-classic','Ethereum Classic','ETC'],['algorand','Algorand','ALGO'],['aave','Aave','AAVE'],['maker','Maker','MKR'],['injective-protocol','Injective','INJ'],['the-graph','The Graph','GRT'],['fantom','Fantom','FTM'],['sui','Sui','SUI'],['sei-network','Sei','SEI'],['mantle','Mantle','MNT']
];
let prices={}, selectedCoin=coinList[0], side='Buy', authMode='login', currentUser=null, usdtBalance=0, coinBalances={}, coinBalancesFresh=false;
const tradeCoinSelect=document.getElementById('tradeCoin');tradeCoinSelect.innerHTML=coinList.map(c=>`<option value="${escAttr(c[0])}">${esc(c[1])} (${esc(c[2])})</option>`).join('');
const fmt=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Number(n)<1?6:2}):'—';
const shortMoney=n=>Number.isFinite(Number(n))?'$'+Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n):'—';
function selectedCoinBalance(){return Number(coinBalances[selectedCoin[2]]||0)}
function formatCoinHolding(symbol){const amount=Number(coinBalances[String(symbol||'').toUpperCase()]||0);return amount>0?amount.toLocaleString('en-US',{maximumFractionDigits:8})+' '+String(symbol||'').toUpperCase():'0 '+String(symbol||'').toUpperCase()}
function updateMarketHoldingLabels(){document.querySelectorAll('[data-user-coin-balance]').forEach(el=>{el.textContent='Your balance: '+formatCoinHolding(el.getAttribute('data-user-coin-balance'))})}
function updatePortfolioDisplay(){
 let total=Number(usdtBalance)||0;
 for(const [symbol,amountValue] of Object.entries(coinBalances)){
  const amount=Number(amountValue)||0;
  const coin=coinList.find(c=>c[2]===symbol);
  if(!coin||amount<=0)continue;
  const price=Number(prices[coin[0]]?.usd);
  if(Number.isFinite(price)&&price>0)total+=amount*price;
 }
 const formatted=total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 document.getElementById('topBalance').innerHTML=formatted+' <span class="muted" style="font-size:13px">USDT</span>';
 document.getElementById('walletBalance').innerHTML=formatted+' <span class="muted" style="font-size:14px">USDT</span>';
 updateMarketHoldingLabels();
}
function updateAvailableAmount(){const el=document.getElementById('availableAmount');if(!currentUser){el.textContent='Available amount: Log in';return}if(side==='Buy'){el.textContent='Available amount: '+usdtBalance.toFixed(2)+' USDT'}else{el.textContent='Available amount: '+selectedCoinBalance().toFixed(8)+' '+selectedCoin[2]}}
function setSide(s){side=s;document.getElementById('buyTab').classList.toggle('active',s==='Buy');document.getElementById('sellTab').classList.toggle('active',s==='Sell');updateAvailableAmount();calcTrade();}
function setCoin(id){selectedCoin=coinList.find(c=>c[0]===id)||coinList[0];document.getElementById('tradeCoin').value=selectedCoin[0];document.getElementById('tradeSymbol').textContent=selectedCoin[2];updateAvailableAmount();calcTrade();}
function setMaxTradeAmount(){const p=Number(prices[selectedCoin[0]]?.usd);let amount=0;if(!currentUser){document.getElementById('tradeMsg').textContent='Please log in before using MAX.';return}if(side==='Buy'){if(p>0)amount=usdtBalance/p}else amount=selectedCoinBalance();document.getElementById('tradeAmount').value=amount>0?amount.toFixed(8).replace(/\.?0+$/,''):'';calcTrade()}
function calcTrade(){let amount=Number(document.getElementById('tradeAmount').value)||0;let p=prices[selectedCoin[0]]?.usd;let total=p&&amount>0?p*amount:0;document.getElementById('tradeTotal').value=total>0?total.toFixed(2):'';const orderButton=document.getElementById('tradeOrderButton');let enough=side==='Buy'?total<=usdtBalance+1e-8:amount<=selectedCoinBalance()+1e-10;orderButton.disabled=!(currentUser && total>0 && p>0 && enough);const msg=document.getElementById('tradeMsg');if(!currentUser){msg.textContent='Log in to convert using your balance.'}else if(total>0&&!enough){msg.textContent=side==='Buy'?'Your USDT balance is insufficient. Press MAX or enter a smaller amount.':'Your '+selectedCoin[2]+' balance is insufficient. Press MAX or enter a smaller amount.'}else if(total>0){msg.textContent=side==='Buy'?'Estimated cost: '+total.toFixed(2)+' USDT. Placing the order will deduct USDT and add coins.':'Estimated value: '+total.toFixed(2)+' USDT. Placing the order will deduct coins and add USDT.'}else{msg.textContent='Enter the coin amount.'}updateAvailableAmount()}
document.getElementById('tradeAmount').addEventListener('input',calcTrade);

function openAccountPanel(){
 const panel=document.getElementById('accountOverlay');
 if(!currentUser){closeAccountPanel();openAuth('login');return}
 document.getElementById('accountPanelUsername').textContent=currentUser;
 document.getElementById('accountPanelBalance').textContent=(Number(usdtBalance)||0).toFixed(2)+' USDT';
 document.getElementById('accountHistoryPanel').classList.add('hidden');
 document.getElementById('accountHistoryPanel').innerHTML='';
 panel.classList.add('show');
}
function closeAccountPanel(){document.getElementById('accountOverlay').classList.remove('show')}
function historyRow(title, detail, status, date){
 const safeStatus=escapeTradeText(status||'—');
 return '<div class="account-history-item"><b>'+escapeTradeText(title)+'</b><br>'+detail+'<br><span class="pill">'+safeStatus+'</span> <span class="muted">'+escapeTradeText(date||'')+'</span></div>';
}
async function loadAccountHistory(kind){
 if(!currentUser){closeAccountPanel();openAuth('login');return}
 const page=document.getElementById('historyPage'),content=document.getElementById('historyPageContent');
 const titles={'deposit-history':'Deposit History','withdraw-history':'Withdrawal History','all-history':'All Account History','trade-history':'Trade History'};
 document.getElementById('historyPageTitle').textContent=titles[kind]||'Account History';
 document.getElementById('historyDepositCount').textContent='—';
 document.getElementById('historyWithdrawCount').textContent='—';
 document.getElementById('historyCurrentBalance').textContent=(Number(usdtBalance)||0).toFixed(2)+' USDT';
 content.innerHTML='<div class="loading">Loading secure account history…</div>';
 closeAccountPanel();page.classList.add('show');page.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
 if(!supabaseClient){content.innerHTML='<div class="history-empty"><strong>Connection unavailable</strong>Please try again later.</div>';return}
 try{
  const [dep,wd]=await Promise.all([
   supabaseClient.from('deposit_requests').select('amount,tx_hash,status,created_at').order('created_at',{ascending:false}).limit(100),
   supabaseClient.from('withdrawal_requests').select('amount_usdt,destination_address,status,admin_note,created_at,updated_at').order('created_at',{ascending:false}).limit(100)
  ]);
  if(dep.error)throw dep.error;if(wd.error)throw wd.error;
  const deposits=dep.data||[],withdrawals=wd.data||[],trades=(typeof getTradeLog==='function'?getTradeLog():[]);
  document.getElementById('historyDepositCount').textContent=String(deposits.length);
  document.getElementById('historyWithdrawCount').textContent=String(withdrawals.length);
  document.getElementById('historyCurrentBalance').textContent=(Number(usdtBalance)||0).toFixed(2)+' USDT';
  const items=[];
  if(kind==='all-history'||kind==='deposit-history')deposits.forEach(r=>items.push({t:new Date(r.created_at).getTime()||0,h:historyRow('Deposit · '+fmtTradeNum(r.amount,4)+' USDT','Transaction Hash: '+escapeTradeText((r.tx_hash||'').slice(0,22))+(r.tx_hash&&r.tx_hash.length>22?'…':''),r.status,new Date(r.created_at).toLocaleString())}));
  if(kind==='all-history'||kind==='withdraw-history')withdrawals.forEach(r=>items.push({t:new Date(r.created_at).getTime()||0,h:historyRow('Withdrawal · '+fmtTradeNum(r.amount_usdt,4)+' USDT','Destination: '+escapeTradeText((r.destination_address||'').slice(0,20))+(r.destination_address&&r.destination_address.length>20?'…':'')+(r.admin_note?' · Note: '+escapeTradeText(r.admin_note):''),r.status,new Date(r.created_at).toLocaleString())}));
  if(kind==='all-history'||kind==='trade-history')trades.forEach(r=>items.push({t:new Date(r.createdAt).getTime()||0,h:historyRow(escapeTradeText(r.side)+' '+escapeTradeText(r.symbol),fmtTradeNum(r.quantity)+' '+escapeTradeText(r.symbol)+' · '+fmtTradeNum(r.bond,4)+' USDT','Completed',new Date(r.createdAt).toLocaleString())}));
  items.sort((a,b)=>b.t-a.t);
  content.innerHTML=items.length?items.map(x=>x.h).join(''):'<div class="history-empty"><strong>No transactions yet</strong>Your completed and pending records will appear here.</div>';
 }catch(e){content.innerHTML='<div class="history-empty"><strong>Unable to load history</strong>'+escapeTradeText(e.message||'Please try again later.')+'</div>'}
}
function closeHistoryPage(){const page=document.getElementById('historyPage');page.classList.remove('show');page.setAttribute('aria-hidden','true');document.body.style.overflow='';}
function accountAction(action){
 if(!currentUser){closeAccountPanel();openAuth('login');return}
 if(action==='deposit'||action==='withdraw'){closeAccountPanel();openSupport(action);return}
 if(action==='password'){closeAccountPanel();openPasswordChange();return}
 if(action==='customer-support'){closeAccountPanel();openTelegram();return}
 loadAccountHistory(action);
}

function marketTrade(id,which){
 const coin=coinList.find(c=>c[0]===id);
 if(!coin)return;
 setCoin(id);setSide(which);
 window.openNavPanel?.(which==='Buy'?'buy-live':'sell-live');
 document.getElementById('tradeMsg').textContent=which+' '+coin[1]+' at the displayed live market quote. Enter the amount and confirm to execute using your Treasury balance.';
 document.getElementById('tradeAmount').focus();
}
function chooseCoin(id){setCoin(id);document.getElementById('trade').scrollIntoView({behavior:'smooth'});document.getElementById('tradeMsg').textContent=selectedCoin[1]+' selected. Choose Buy or Sell, enter an amount, then click Order.'}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escAttr(s){return String(s).replace(/[^a-z0-9-]/gi,'')}
function openAuth(mode){setAuthMode(mode);document.getElementById('authOverlay').classList.add('show')}
function closeAuth(){document.getElementById('authOverlay').classList.remove('show')}
function setAuthMode(mode){authMode=mode;document.getElementById('authTitle').textContent=mode==='login'?'Welcome back':'Create account';document.getElementById('authSubmit').textContent=mode==='login'?'Login':'Register';document.getElementById('authForgotButton').classList.toggle('hidden',mode!=='login');document.getElementById('loginMode').classList.toggle('active',mode==='login');document.getElementById('registerMode').classList.toggle('active',mode==='register');document.getElementById('authMsg').textContent='';document.getElementById('password').autocomplete=mode==='login'?'current-password':'new-password'}

// Supabase backend configuration (phone + password, no OTP).
// In Supabase Dashboard, Authentication > Providers > Phone: enable Phone provider.
// In Authentication settings, turn OFF 'Confirm phone' to avoid OTP confirmation.
// This means phone ownership is NOT verified. Never put a service_role key in a browser file.
const SUPABASE_URL = 'https://aagsmafemvtmepoorfbd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e0xe_e6Jo181m4oAP7hkQA_aVwIYwJA';
let supabaseClient = null;
let backendReady = false;
try {
 if (window.supabase && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && !SUPABASE_ANON_KEY.includes('PASTE_')) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  backendReady = true;
 }
} catch (err) { console.error('Supabase initialization failed:', err); }

function normalizePhone(raw, code){
 const input=String(raw||'').trim().replace(/[\s().-]/g,'');
 let phone;
 if(input.startsWith('+')) phone='+'+input.slice(1).replace(/\D/g,'');
 else phone=code+input.replace(/\D/g,'').replace(/^0+/,'');
 return phone;
}
function isValidInternationalPhone(phone){
 if(!/^\+[1-9]\d{7,14}$/.test(phone)) return false;
 if(phone.startsWith('+880')) return /^\+8801\d{9}$/.test(phone);
 return true;
}
document.getElementById('authForm').addEventListener('submit', async e=>{
 e.preventDefault();
 const rawPhone=document.getElementById('phone').value;
 const code=document.getElementById('countryCode').value;
 const phone=normalizePhone(rawPhone,code);
 const password=document.getElementById('password').value;
 const msg=document.getElementById('authMsg');
 msg.style.color='#ffc2cb';
 if(!isValidInternationalPhone(phone)){
  msg.textContent='Enter your full mobile number with country code, for example +8801XXXXXXXXX.';
  return;
 }
 if(password.length<6){msg.textContent='Password must be at least 6 characters long.';return;}
 if(!backendReady || !supabaseClient){
  msg.textContent='Backend is not connected yet. Add your Supabase URL and anon key to the HTML, then try again.';
  return;
 }
 const submit=document.getElementById('authSubmit');
 submit.disabled=true;
 try {
  if(authMode==='register'){
   const {data,error}=await supabaseClient.auth.signUp({phone,password});
   if(error) throw error;
   if(data.session){
    currentUser=phone;
    msg.style.color='#70e3b6';
    msg.textContent='Account registered successfully.';
    await notifyTelegramEvent('registration',{phone});
    finishLogin();
   } else {
    msg.style.color='#70e3b6';
    msg.textContent='Registration request received. Check whether Confirm Phone is disabled in Supabase; if enabled, an OTP may be required.';
   }
  } else {
   const {data,error}=await supabaseClient.auth.signInWithPassword({phone,password});
   if(error) throw error;
   currentUser=data.user?.phone || phone;
   finishLogin();
  }
 } catch(err) {
  const raw=String(err?.message||'');
  if(/already registered|already exists|duplicate|unique/i.test(raw)) msg.textContent='An account already exists with this mobile number. Please log in.';
  else if(/invalid login credentials/i.test(raw)) msg.textContent='Incorrect mobile number or password.';
  else msg.textContent='Request failed: '+raw+' (Check your Supabase Phone Auth settings.)';
 } finally {submit.disabled=false;}
});
if(backendReady){
 supabaseClient.auth.getSession().then(({data})=>{
  if(data?.session?.user?.phone){currentUser=data.session.user.phone;finishLogin();}
 });
 supabaseClient.auth.onAuthStateChange((_event,session)=>{
  if(session?.user?.phone){currentUser=session.user.phone;}
 });
}
async function finishLogin(){document.getElementById('authButton').classList.add('hidden');document.getElementById('logoutButton').classList.remove('hidden');document.getElementById('settingsButton').classList.remove('hidden');document.getElementById('userBadge').classList.remove('hidden');document.getElementById('userBadge').textContent=currentUser;closeAuth();await refreshBalances();calcTrade();renderProfitChart()}
async function refreshBalances(options={}){
 if(!supabaseClient||!currentUser){if(options.strict)throw new Error('Please log in again before withdrawing.');return}
 try{
  const balanceRequest=supabaseClient.rpc('get_my_balance');
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Balance check timed out. Please check your connection and try again.')),12000));
  const {data,error}=await Promise.race([balanceRequest,timeout]);
  if(error)throw error;
  const rawBalance=(data&&typeof data==='object')?(data.balance??data.usdt_balance??data.amount??0):data;
  const parsedBalance=Number(rawBalance);
  if(!Number.isFinite(parsedBalance)||parsedBalance<0)throw new Error('Supabase returned an invalid USDT balance.');
  usdtBalance=parsedBalance;
  if(!options.strict){
   const holdingsRequest=supabaseClient.rpc('get_my_coin_balances');
   const holdingsTimeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('Coin balance request timed out.')),8000));
   try{
    const {data:holdings,error:he}=await Promise.race([holdingsRequest,holdingsTimeout]);
    if(!he&&Array.isArray(holdings)){
     coinBalances={};holdings.forEach(x=>{coinBalances[String(x.symbol||'').toUpperCase()]=Number(x.amount)||0});coinBalancesFresh=true;
     document.getElementById('coinHoldings').textContent='Coin holdings: '+(holdings.filter(x=>Number(x.amount)>0).map(x=>Number(x.amount).toLocaleString('en-US',{maximumFractionDigits:8})+' '+String(x.symbol).toUpperCase()).join(', ')||'None');
    }else if(he){coinBalancesFresh=false;console.error('Coin balance load failed',he);document.getElementById('coinHoldings').textContent='Coin balances unavailable';}
   }catch(coinErr){coinBalancesFresh=false;console.error('Coin balance load failed',coinErr);document.getElementById('coinHoldings').textContent='Coin balances unavailable';}
  }
  updatePortfolioDisplay();updateAvailableAmount();calcTrade();updateWithdrawValidation();
  return usdtBalance;
 }catch(err){
  console.error('Balance load failed',err);
  document.getElementById('tradeMsg').textContent='Balance could not be loaded: '+(err.message||'Unknown error');
  if(options.strict)throw err;
  return null;
 }
}
async function logout(){
 if(backendReady&&supabaseClient){try{await supabaseClient.auth.signOut({scope:'local'})}catch(e){console.warn('Local sign-out warning:',e?.message||e)}}
 currentUser=null;usdtBalance=0;coinBalances={};document.getElementById('authButton').classList.remove('hidden');document.getElementById('logoutButton').classList.add('hidden');document.getElementById('settingsButton').classList.add('hidden');document.getElementById('userBadge').classList.add('hidden');document.getElementById('coinHoldings').textContent='Coin holdings: —';updatePortfolioDisplay();updateAvailableAmount();calcTrade();updateWithdrawValidation();
}
async function previewTrade(){
 const amount=Number(document.getElementById('tradeAmount').value), price=Number(prices[selectedCoin[0]]?.usd), tradeMsg=document.getElementById('tradeMsg');
 if(!currentUser||!supabaseClient){tradeMsg.textContent='Please log in first.';return}
 if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(price)||price<=0){tradeMsg.textContent='Invalid amount or market price.';return}
 const btn=document.getElementById('tradeOrderButton');btn.disabled=true;tradeMsg.style.color='';
 const completedSide=side, completedSymbol=selectedCoin[2], completedCoinName=selectedCoin[1];
 try{
  const {data,error}=await supabaseClient.rpc('convert_usdt_to_coin',{p_symbol:completedSymbol,p_side:completedSide,p_coin_amount:amount,p_usd_price:price});
  if(error)throw error;
  const tradeResult=data||{};
  if(tradeResult.success===false)throw new Error(tradeResult.message||'The order was not completed.');
