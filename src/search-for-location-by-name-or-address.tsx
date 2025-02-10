import { ActionPanel, Detail, List, Action, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "node-fetch";

interface Location {
    display_name: string;
    address?: {
        [key: string]: string;
    };
    lat?: string;
    lon?: string;
    type?: string;
    category?: string;
}

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const searchLocations = async () => {
            if (!searchText) {
                setLocations([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=jsonv2`,
                    {
                        headers: {
                            "User-Agent": "Raycast Extension/1.0",
                        },
                    }
                );
                const data = await response.json();
                setLocations(data);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(searchLocations, 300);
        return () => clearTimeout(timeoutId);
    }, [searchText]);

    return (
        <List
            isLoading={isLoading}
            onSearchTextChange={setSearchText}
            searchBarPlaceholder="Search locations..."
        >
            {locations.map((location, index) => (
                <List.Item
                    key={index}
                    icon={Icon.Map}
                    title={location.display_name}
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="Show Details"
                                target={<LocationDetail location={location} />}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}

function LocationDetail({ location }: { location: Location }) {
    const addressDetails = location.address
        ? Object.entries(location.address)
            .map(([key, value]) => `- **${key}**: ${value}`)
            .join("\n")
        : "No address details available";

    const coordinates = location.lat && location.lon ? `${location.lat}, ${location.lon}` : "N/A";
    const formattedAddress = location.display_name || "No address available";
    const markdown = `
# ${location.display_name}

## Address Details
${addressDetails}

## Additional Information
- **Type**: ${location.type || "N/A"}
- **Category**: ${location.category || "N/A"}
- **Coordinates**: ${location.lat ? `${location.lat}, ${location.lon}` : "N/A"}
`;

    return (
        <Detail
            markdown={markdown}
            actions={
                <ActionPanel>
                    <ActionPanel.Section>
                        {location.lat && location.lon && (
                            <Action.CopyToClipboard
                                title="Copy Coordinates"
                                content={coordinates}
                                shortcut={{ modifiers: [], key: "enter" }}
                            />
                        )}
                        <Action.CopyToClipboard
                            title="Copy Address"
                            content={formattedAddress}
                            shortcut={{ modifiers: ["opt"], key: "enter" }}
                        />
                    </ActionPanel.Section>
                </ActionPanel>
            }
        />
    );
}