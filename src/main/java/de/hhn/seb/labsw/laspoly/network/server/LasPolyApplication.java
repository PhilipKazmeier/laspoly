package de.hhn.seb.labsw.laspoly.network.server;

import de.hhn.seb.labsw.laspoly.network.server.resource.GamesResource;
import de.hhn.seb.labsw.laspoly.network.server.resource.UsersResource;
import java.util.HashSet;
import java.util.Set;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;
import org.glassfish.jersey.media.sse.SseFeature;

/**
 * JAX-RS application for the LasPoly multiplayer backend.
 * Deployed at context path {@code /laspoly} (Tomcat WAR or embedded Grizzly).
 */
@ApplicationPath("/")
public class LasPolyApplication extends Application {

    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> classes = new HashSet<>();
        classes.add(UsersResource.class);
        classes.add(GamesResource.class);
        classes.add(SseFeature.class);
        return classes;
    }
}
