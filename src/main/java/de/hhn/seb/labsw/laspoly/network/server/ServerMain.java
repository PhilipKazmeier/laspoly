package de.hhn.seb.labsw.laspoly.network.server;

import java.net.URI;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

/**
 * Embedded HTTP server for local dev and Docker.
 * Default: {@code http://localhost:8080/laspoly/}
 */
public final class ServerMain {

    public static final String DEFAULT_BASE_URI = "http://0.0.0.0:8080/laspoly/";

    private static final Logger LOG = Logger.getLogger(ServerMain.class.getName());

    private ServerMain() {
    }

    public static void main(String[] args) throws Exception {
        String baseUri = System.getenv().getOrDefault("LASPOLY_BASE_URI", DEFAULT_BASE_URI);
        if (args.length > 0) {
            baseUri = args[0];
        }
        if (!baseUri.endsWith("/")) {
            baseUri = baseUri + "/";
        }

        ResourceConfig config = ResourceConfig.forApplication(new LasPolyApplication());
        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(URI.create(baseUri), config, false);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("Shutting down LasPoly server");
            server.shutdownNow();
        }));

        server.start();
        LOG.info("LasPoly server listening at " + baseUri);
        LOG.info("  users: GET/POST " + baseUri + "users/...");
        LOG.info("  games: GET/POST " + baseUri + "games/...");

        try {
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.log(Level.INFO, "Interrupted", e);
        }
    }
}
