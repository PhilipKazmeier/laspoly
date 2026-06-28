/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.server.dao.UserDao;
import de.hhn.seb.labsw.laspoly.utils.Final;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

public enum UserDaoCache implements UserDao
{
    instance;

    private static int id;
    private final Logger logger = Logger.getAnonymousLogger();
    private final List<User> registeredUsers = new ArrayList<User>();
    private final List<User> loggedInUsers = new ArrayList<User>();

    @Override
    public List<User> getRegisteredUsers() {
        return this.registeredUsers;
    }

    @Override
    public List<User> getLoggedInUsers() {
        return this.loggedInUsers;
    }

    @Override
    public void register(User user) {
        this.logger.info("register");
        for (User existing : this.registeredUsers) {
            if (existing.getName().equalsIgnoreCase(user.getName())) {
                user.setId(existing.getId());
                user.setLocale(existing.getLocale());
                this.logger.info("reusing user id " + existing.getId() + " for " + user.getName());
                return;
            }
        }
        user.setId(++id);
        this.registeredUsers.add(user);
        this.logger.info(this.registeredUsers.toString());
    }

    @Override
    public void login(User user) throws UserNotKnownException {
        this.logger.info("login");
        User known = null;
        for (User registered : this.registeredUsers) {
            if (registered.getName().equalsIgnoreCase(user.getName())) {
                known = registered;
                break;
            }
        }
        if (known == null) {
            throw new UserNotKnownException(user);
        }
        user.setId(known.getId());
        user.setLocale(known.getLocale());
        if (!this.loggedInUsers.contains(known)) {
            this.loggedInUsers.add(known);
        }
        this.logger.info(this.registeredUsers.toString());
    }

    @Override
    public void logout(User user) throws UserNotKnownException {
        this.logger.info("logout");
        this.logger.info(this.registeredUsers.toString());
        if (!this.registeredUsers.contains(user)) {
            throw new UserNotKnownException(user);
        }
        this.loggedInUsers.remove(user);
    }

    @Override
    public void changeUserData(User changedUser) throws UserNotKnownException {
        this.logger.info("changeUserData");
        Final<Object> user = new Final<Object>(null);
        this.registeredUsers.forEach(u -> {
            if (u.equals(changedUser)) {
                user.set(u);
            }
        });
        if (user.value() == null) {
            throw new UserNotKnownException(changedUser);
        }
        ((User)user.value()).setLocale(changedUser.getLocale());
        ((User)user.value()).setName(changedUser.getName());
    }
}

