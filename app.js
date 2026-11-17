
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
