export function Home(): string {
  return `
    <div class="home-page">
    <h1 class="home-page-title">After more than 20 projects...</h1>
      <div class="section left-image">
        <div class="text-content">
          <h2>The 42 Common Core</h2>
          <p>
            Composed by 23 projects and 5 exams.  
          </p>
          <p>
            It emphasizes peer learning, creativity, and real-world collaboration — preparing students to tackle complex software challenges independently.
          </p>
        </div>
        <div class="image-content circle-image"></div>
        </div>
        
        <h1 class="home-page-title">...two years of work...</h1>
      <div class="section right-image">
      <div class="image-content october-image"></div>
      <div class="text-content">
        <h2>Piscine October 2023</h2>
          <p>
            It began on September 18th, 2023, and was composed of 155 people, of whom 90 became students.          </p>
          <p>
            Saroca-f and Schamizo are from this piscine. They met on the first day because they sat in the same cluster row.
            Two years later, they are still friends.
          </p>
      </div>
      </div>

      <h1 class="home-page-title">...hundreds of people...</h1>
            <section class="section left-image">
        <div class="text-content">
          <h2>Piscine November 2023</h2>
          <p>
            It began on October 23th, 2023, and was composed of 189 people, of whom only 100 became students.          </p>
          </p>
          <p>
Jeandrad and Pablogon are from this piscine. Like the October piscine, they started as students on November 27th.          </p>
        </div>
        <div class="image-content november-image"></div>
        </section>
        <h1 class="home-page-title">...thousands of stories...</h1>
      <div class="section right-image">
      <div class="image-content cards-image"></div>
      <div class="text-content">
        <h2>The past of the time</h2>
          <p>
            We can see it in our student cards, but also feel it in ourselfs.
          </p>
          <p>
            Together, the four of us have logged over 10,000 hours coding on 42's computers.
          </p>
      </div>
      </div>
        <h1 class="home-page-title">...we have finally reached...</h1>

    </div>
  `;
}

export function homeText(): string {
    return `
        <div class="home-text">
            <h1 class="main-title">FT_TRANSCENDENCE</h1>
            <p class="last-project">This is the end of the Common Core</p>
            <button onclick="window.location.hash = '#/game';" class="game-btn">
                <span>Let's play</span>
            </button>
        </div>
    `;
}

export function handleStars(): void {
    const body = document.getElementsByClassName("home-page");
    const winHeight = window.innerHeight;
    const winWidth = window.innerWidth;

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.animation = `twinkle ${(Math.random() * 5 + 5)}s linear ${(Math.random() * 5 + 5)}s infinite`;
        star.style.top = `${Math.random() * winHeight}px`;
        star.style.left = `${Math.random() * winWidth}px`;
        star.style.position = 'absolute';
        body[0].appendChild(star);
    }
}