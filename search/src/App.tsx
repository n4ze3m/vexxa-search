import { useDisclosure } from "@mantine/hooks";
import {
  AppShell,
  Burger,
  Text,
  Container,
  TextInput,
  Card,
} from "@mantine/core";
import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function App() {
  const [opened, { toggle }] = useDisclosure();

  const [search, setSearch] = React.useState<string | undefined>();

  const { data, status } = useQuery(
    ["searchLinks", search],
    async () => {
      if (!search) return { results: [] };
      const response = await fetch("http://localhost:3000/link/search", {
        body: JSON.stringify({ query: search }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      return data as {
        results: {
          pageContent: string;
          metadata: string;
        }[];
      };
    },
    {
      enabled: !!search,
    }
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Text m="md" size="xl" fw={700}>
          VexxaSearch
        </Text>
      </AppShell.Header>
      <Container style={{ paddingTop: 100 }}>
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          required
          placeholder="Search your links"
        />
      </Container>

      <Container>
        {status === "success" &&
          data.results.map((result) => (
            <Card
              shadow="xs"
              padding="sm"
              radius="sm"
              style={{ marginBottom: 10 }}
            >
              <Text>{result.pageContent}</Text>
              <Text size="xs" color="gray">
                {JSON.parse(result.metadata).url}
              </Text>
            </Card>
          ))}
      </Container>
    </AppShell>
  );
}
