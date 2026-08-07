const darkModeBtn = document.getElementById("darkModeBtn");

const currentTheme = localStorage.getItem("theme");

if(currentTheme==="dark"){

    document.body.classList.add("dark");

}

if(darkModeBtn){

    darkModeBtn.addEventListener("click",()=>{

        document.body.classList.toggle("dark");

        if(document.body.classList.contains("dark")){

            localStorage.setItem("theme","dark");

        }else{

            localStorage.setItem("theme","light");

        }

    });

}