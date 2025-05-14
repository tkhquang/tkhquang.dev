import Link from "next/link";
import HorizontalLine from "@/components/common/HorizontalLine";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MarkdownCategory } from "@/models/markdown.types";

export function PathInfo({
  category,
  className,
}: {
  category: MarkdownCategory;
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
              <Link href="/blog/categories">Categories</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <span className="mx-2">{`->`}</span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/blog/categories/${category.slug}`}>
                {category.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <HorizontalLine className="my-3" />
    </div>
  );
}
