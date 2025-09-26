import React from 'react';
import "../../css/includes.css";

export default function Welcome({ user }){
  return(
    <div className="centralizawelcome">
      <div className="welcome-message">
        <div className="imageWelcome"><img src="armazium.png"/></div>
        {user ? `Bem-vindo(a), ${user.name}` : '...'}
      </div>
    </div>
  );
}