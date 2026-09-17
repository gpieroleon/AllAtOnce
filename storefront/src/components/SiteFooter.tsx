import Link from "next/link";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>
            Todo lo que necesitas, de una vez. Tecnología, moda, hogar, belleza y accesorios con
            envío exprés y devoluciones gratis durante 30 días.
          </p>
          <div className="footer__pay">
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>AMEX</span>
            <span>PAYPAL</span>
            <span>BIZUM</span>
          </div>
        </div>
        <div className="footer__col">
          <h4>Comprar</h4>
          <Link href="/categoria/ofertas">Ofertas flash</Link>
          <Link href="/categoria/Tecnología">Tecnología</Link>
          <Link href="/categoria/Moda">Moda</Link>
          <Link href="/categoria/Hogar">Hogar</Link>
          <Link href="/categoria/Belleza">Belleza</Link>
          <Link href="/categoria/Accesorios">Accesorios</Link>
        </div>
        <div className="footer__col">
          <h4>Ayuda</h4>
          <Link href="/contacto">Contacto</Link>
          <Link href="/politicas">Envíos y devoluciones</Link>
          <Link href="/politicas">Política de privacidad</Link>
          <Link href="/politicas">Términos y condiciones</Link>
          <Link href="/recuperar">Recuperar contraseña</Link>
        </div>
        <div className="footer__col">
          <h4>All At Once</h4>
          <Link href="/sobre-nosotros">Sobre nosotros</Link>
          <Link href="/cuenta">Mi cuenta</Link>
          <Link href="/favoritos">Favoritos</Link>
          <Link href="/buscar">Buscar</Link>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 All At Once. Todos los derechos reservados.</span>
        <span>
          Hecho con <Link href="/contacto">atención al detalle</Link>
        </span>
      </div>
    </footer>
  );
}
