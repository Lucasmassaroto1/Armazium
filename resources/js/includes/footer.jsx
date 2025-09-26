import '../../css/includes.css';
export default function Footer(){
  return(
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} Lucas Massaroto, Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}