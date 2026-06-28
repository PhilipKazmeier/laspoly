/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.resource;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.server.dao.UserDaoCache;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Type;
import java.util.List;
import java.util.logging.Logger;
import javax.inject.Singleton;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Response;
import org.joda.time.DateTime;

@Path(value="users")
@Singleton
public class UsersResource {
    private final Gson gson = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
    private final Logger logger = Logger.getLogger(UsersResource.class.getName());

    @GET
    @Produces(value={"application/json"})
    public final String getUsers() {
        this.logger.info("/users: GET");
        List<User> users = UserDaoCache.instance.getRegisteredUsers();
        return this.gson.toJson(users);
    }

    @GET
    @Path(value="/clearAll")
    @Produces(value={"application/json"})
    public final String clearAll() {
        UserDaoCache.instance.getRegisteredUsers().clear();
        UserDaoCache.instance.getLoggedInUsers().clear();
        return "Success";
    }

    @POST
    @Path(value="/register")
    public final Response registerUser(String userJson) {
        this.logger.info("/users/register: " + userJson);
        User user = this.gson.fromJson(userJson, User.class);
        UserDaoCache.instance.register(user);
        return Response.status(Response.Status.OK).entity(this.gson.toJson(user)).build();
    }

    @POST
    @Path(value="/login")
    public final Response loginUser(String userJson) {
        this.logger.info("/users/login: " + userJson);
        User user = this.gson.fromJson(userJson, User.class);
        try {
            UserDaoCache.instance.login(user);
        }
        catch (UserNotKnownException e) {
            this.logger.severe(e.getMessage());
            StringWriter errors = new StringWriter();
            e.printStackTrace(new PrintWriter(errors));
            this.logger.severe(errors.toString());
            return Response.status(500).entity(e.getMessage()).build();
        }
        return Response.status(Response.Status.OK).entity(this.gson.toJson(user)).build();
    }

    @POST
    @Path(value="/logout")
    public final Response logoutUser(String userJson) {
        this.logger.info("/users/logout: " + userJson);
        User user = this.gson.fromJson(userJson, User.class);
        try {
            UserDaoCache.instance.logout(user);
        }
        catch (UserNotKnownException e) {
            this.logger.severe(e.getMessage());
            StringWriter errors = new StringWriter();
            e.printStackTrace(new PrintWriter(errors));
            this.logger.severe(errors.toString());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
        return Response.status(Response.Status.OK).entity(this.gson.toJson(user)).build();
    }

    @POST
    @Path(value="/changeData")
    public final Response changeData(String userJson) {
        this.logger.info("/users/changeData");
        User user = this.gson.fromJson(userJson, User.class);
        try {
            UserDaoCache.instance.changeUserData(user);
        }
        catch (UserNotKnownException e) {
            this.logger.severe(e.getMessage());
            StringWriter errors = new StringWriter();
            e.printStackTrace(new PrintWriter(errors));
            this.logger.severe(errors.toString());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
        return Response.status(Response.Status.OK).build();
    }
}

