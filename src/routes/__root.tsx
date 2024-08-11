import { Auth } from "@/components/Auth"
import { supabase } from "@/lib/supabase"
import { authStore, sessionAtom } from "@/store/session"
import { MantineProvider, createTheme } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Outlet, createRootRoute } from "@tanstack/react-router"
import { ScrollRestoration } from "@tanstack/react-router"
import { useOnline } from "@uiw/react-use-online"
import { set } from "idb-keyval"
import { useAtom } from "jotai"
import { Suspense, useEffect } from "react"
import { ReloadPrompt } from "./-components/ReloadPrompt"
import { Shell } from "./-components/Shell"
import { TanStackRouterDevtools } from "./-components/TanStackRouterDevtools"

import "virtual:uno.css"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import "./styles.css"

const queryClient = new QueryClient()

const theme = createTheme({
	primaryColor: "green",
})

export const Route = createRootRoute({
	component: function Root() {
		const [session, setSession] = useAtom(sessionAtom)
		const isOnline = useOnline()

		useEffect(() => {
			if (!isOnline) return
			supabase.auth.getSession().then(({ data: { session } }) => {
				setSession(session)
				if (session) set("session", session, authStore)
			})

			const {
				data: { subscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				setSession(session)
				set("session", session, authStore)
			})

			return () => subscription.unsubscribe()
		}, [isOnline, setSession])

		return (
			<MantineProvider theme={theme}>
				<QueryClientProvider client={queryClient}>
					<ScrollRestoration />
					<Shell>
						{!session ? (
							<div className="mx-auto max-w-prose">
								<Auth supabaseClient={supabase} providers={["google"]} />
							</div>
						) : (
							<Outlet />
						)}
						<Suspense>
							<TanStackRouterDevtools position="bottom-right" />
						</Suspense>
					</Shell>
					<ReloadPrompt />
				</QueryClientProvider>
			</MantineProvider>
		)
	},
})
