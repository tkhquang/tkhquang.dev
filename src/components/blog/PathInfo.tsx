import Link from "next/link";
import HorizontalLine from "@/components/common/HorizontalLine";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function PathInfo<
  T extends { title: string; slug: string },
  K extends keyof T,
>({
  className,
  item,
  itemSlugField = "slug" as K,
  pathSlug,
  title,
}: {
  title: string;
  pathSlug: string;
  item: T;
  itemSlugField?: K;
  className?: string;
}) {
  return (
    <div className={className}>
      <HorizontalLine className="my-3" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/blog">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <span className="mx-2">{`->`}</span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/blog/categories">{title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <span className="mx-2">{`->`}</span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/blog/${pathSlug}/${item[itemSlugField]}`}>
                {item.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <HorizontalLine className="my-3" />
    </div>
  );
}
