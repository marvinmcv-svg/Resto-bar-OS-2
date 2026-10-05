/* eslint-disable @typescript-eslint/no-unused-vars -- shim drops the Next-only prefetch prop */
import { forwardRef, type AnchorHTMLAttributes } from "react";
import { useDemoRouter } from "../router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, onClick, prefetch: _p, ...rest }, ref) {
  const { push } = useDemoRouter();
  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        push(href);
      }}
      {...rest}
    />
  );
});

export default Link;
