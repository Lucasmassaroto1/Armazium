import React from 'react';

export default function Welcome({ user }){
  const name = user?.name ?? '...';
  return (
    <div className="centralizawelcome">
      <div className="welcome-message">
        <div className="imageWelcome">
          <img src="armazium.png" alt="Logotipo Armazium" loading="lazy"/>
        </div>
        {`Bem-vindo(a), ${name}`}
      </div>
    </div>
  );
}