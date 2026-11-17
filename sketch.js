let idleSprite; // 儲存角色一的待機精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let pushSprite; // 儲存角色一的推擊精靈圖
let magicSprite; // 儲存魔法特效精靈圖
let bgImg; // 儲存背景圖片
let bgLoaded = false; // 記錄背景圖是否成功載入

let characterX = 0; // 儲存角色在畫布上的水平位置
let bgX = 0; // 儲存背景的捲動偏移量
let facingDirection = 1; // 記錄角色目前面向的方向
let isPushing = false; // 記錄角色是否正在播放推擊動畫
let pushStartFrame = 0; // 記錄推擊動畫開始時的畫面影格
let pushDirection = 1; // 記錄推擊動畫開始時角色面向的方向
let magicEffects = []; // 儲存目前畫面中的魔法特效

const idleFrameCount = 10;
const idleFrameWidth = 1395 / idleFrameCount;
const idleFrameHeight = 196;

const walkFrameCount = 9;
const walkFrameWidth = 1246 / walkFrameCount;
const walkFrameHeight = 198;

const pushFrameCount = 4;
const pushFrameWidth = 1039 / pushFrameCount;
const pushFrameHeight = 146;

const magicFrameCount = 5;
const magicFrameWidth = 740 / magicFrameCount;
const magicFrameHeight = 19;

function preload() {
  // 載入角色精靈圖
  idleSprite = loadImage('1/stop/stop.png');
  walkSprite = loadImage('1/walk/walk.png');
  pushSprite = loadImage('1/push/push.png');
  magicSprite = loadImage('1/magic/magic.png');
  
  // 載入指定的背景圖片 backround/0.png（注意資料夾拼字）
  bgImg = loadImage(
    'backround/0.png', 
    () => { bgLoaded = true; }, 
    () => { console.log('背景圖片載入失敗，請確認 backround/0.png 是否存在'); }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  frameRate(10);
  
  // 初始化角色位置在畫布正中央
  const initialScale = getCharacterScale(idleFrameWidth, idleFrameHeight);
  characterX = width / 2 - (idleFrameWidth * initialScale) / 2;
}

function getCharacterScale(spriteWidth, spriteHeight) {
  return min((height * 0.4) / spriteHeight, (width * 0.35) / spriteWidth);
}

function spawnMagicEffect(direction) {
  const effectScale = getCharacterScale(magicFrameWidth, magicFrameHeight);
  const effectWidth = magicFrameWidth * effectScale;
  const effectHeight = magicFrameHeight * effectScale;
  const playerScale = getCharacterScale(idleFrameWidth, idleFrameHeight);
  const playerWidth = idleFrameWidth * playerScale;
  const playerHeight = idleFrameHeight * playerScale;
  const effectX = direction > 0 ? characterX + playerWidth : characterX - effectWidth;
  
  magicEffects.push({ 
    x: effectX, 
    y: height - playerHeight * 0.55 - effectHeight / 2, 
    direction: direction 
  });
}

function drawMagicEffects() {
  const effectScale = getCharacterScale(magicFrameWidth, magicFrameHeight);
  const effectWidth = magicFrameWidth * effectScale;
  const effectHeight = magicFrameHeight * effectScale;
  
  for (let i = magicEffects.length - 1; i >= 0; i -= 1) {
    const effect = magicEffects[i];
    effect.x += effect.direction * 12 * effectScale;
    
    if (effect.x > width * 2 || effect.x < -width) {
      magicEffects.splice(i, 1);
      continue;
    }
    
    const effectFrame = floor(frameCount / 2) % magicFrameCount;
    if (effect.direction < 0) {
      push();
      translate(effect.x + effectWidth, effect.y);
      scale(-1, 1);
      image(magicSprite, 0, 0, effectWidth, effectHeight, effectFrame * magicFrameWidth, 0, magicFrameWidth, magicFrameHeight);
      pop();
    } else {
      image(magicSprite, effect.x, effect.y, effectWidth, effectHeight, effectFrame * magicFrameWidth, 0, magicFrameWidth, magicFrameHeight);
    }
  }
}

function draw() {
  background(135, 206, 235); // 預設背景色（防護用）

  // 計算背景圖片等比例縮放後的尺寸
  let bgWidth = width;
  let bgHeight = height;
  if (bgLoaded) {
    bgHeight = height;
    bgWidth = bgImg.width * (height / bgImg.height);
  }

  // 鍵盤輸入偵測
  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  const inputDirection = movingRight ? 1 : movingLeft ? -1 : 0;

  if (!isPushing && inputDirection !== 0) {
    facingDirection = inputDirection;
  }

  if (isPushing && frameCount - pushStartFrame >= pushFrameCount * 2) {
    isPushing = false;
    spawnMagicEffect(pushDirection);
  }

  const isWalking = !isPushing && inputDirection !== 0;
  const activeSprite = isPushing ? pushSprite : isWalking ? walkSprite : idleSprite;
  const activeFrameCount = isPushing ? pushFrameCount : isWalking ? walkFrameCount : idleFrameCount;
  const activeFrameWidth = isPushing ? pushFrameWidth : isWalking ? walkFrameWidth : idleFrameWidth;
  const activeFrameHeight = isPushing ? pushFrameHeight : isWalking ? walkFrameHeight : idleFrameHeight;

  const characterScale = getCharacterScale(activeFrameWidth, activeFrameHeight);
  const displayWidth = activeFrameWidth * characterScale;
  const displayHeight = activeFrameHeight * characterScale;

  // 背景捲動極限範圍（三張串接，左極限與右極限）
  const maxBgX = bgWidth; 
  const minBgX = -bgWidth;

  // 互動邏輯：背景捲動優先，當背景到底時才移動角色
  if (inputDirection !== 0 && !isPushing) {
    let moveSpeed = 6 * characterScale;

    if (inputDirection === 1) { // 按下右鍵
      if (bgX > minBgX) {
        bgX -= moveSpeed; // 背景向左移動
        bgX = max(bgX, minBgX);
      } else {
        // 背景已到最右邊（捲動到底），背景暫停，角色開始往右走
        characterX = constrain(characterX + moveSpeed, 0, width - displayWidth);
      }
    } else if (inputDirection === -1) { // 按下左鍵
      if (bgX < maxBgX) {
        bgX += moveSpeed; // 背景向右移動
        bgX = min(bgX, maxBgX);
      } else {
        // 背景已到最左邊（捲動到底），背景暫停，角色開始往左走
        characterX = constrain(characterX - moveSpeed, 0, width - displayWidth);
      }
    }
  }

  // 繪製三張串接的背景圖片 (左、中、右)
  if (bgLoaded) {
    const baseBgX = (width - bgWidth) / 2 + bgX;
    image(bgImg, baseBgX - bgWidth, 0, bgWidth, bgHeight); // 左側背景
    image(bgImg, baseBgX, 0, bgWidth, bgHeight);             // 中間背景
    image(bgImg, baseBgX + bgWidth, 0, bgWidth, bgHeight); // 右側背景
  }

  // 繪製角色
  const characterY = height - displayHeight;
  const currentFrame = isPushing ? min(floor((frameCount - pushStartFrame) / 2), pushFrameCount - 1) : frameCount % activeFrameCount;

  if (facingDirection < 0) {
    push();
    translate(characterX + displayWidth, characterY);
    scale(-1, 1);
    image(activeSprite, 0, 0, displayWidth, displayHeight, currentFrame * activeFrameWidth, 0, activeFrameWidth, activeFrameHeight);
    pop();
  } else {
    image(activeSprite, characterX, characterY, displayWidth, displayHeight, currentFrame * activeFrameWidth, 0, activeFrameWidth, activeFrameHeight);
  }

  drawMagicEffects();
}

function keyPressed() {
  if (keyCode === 32 && !isPushing) {
    isPushing = true;
    pushStartFrame = frameCount;
    pushDirection = facingDirection;
    return false;
  }
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}