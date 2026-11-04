import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import { TypographyMark, TypographyMuted } from "@/components/ui/typography";
import {
  IllosAnalytics,
  IllosApiGateway,
  IllosBilling,
  IllosCiPipeline,
  IllosContainers,
  IllosCron,
  IllosDatabase,
  IllosEmail,
  IllosEncryption,
  IllosFirewall,
  IllosImageProcessing,
  IllosMigration,
  IllosNotifications,
  IllosQueue,
  IllosTwoFactor,
  IllosUploads,
  IllosVersionControl,
} from "@/components/illos/isometric";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    IllosAnalytics,
    IllosApiGateway,
    IllosBilling,
    IllosCiPipeline,
    IllosContainers,
    IllosCron,
    IllosDatabase,
    IllosEmail,
    IllosEncryption,
    IllosFirewall,
    IllosImageProcessing,
    IllosMigration,
    IllosNotifications,
    IllosQueue,
    IllosTwoFactor,
    IllosUploads,
    IllosVersionControl,
    TypographyMark,
    TypographyMuted,
    ...components,
  };
}
