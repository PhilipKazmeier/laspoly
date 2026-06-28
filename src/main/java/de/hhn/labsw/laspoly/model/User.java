package de.hhn.labsw.laspoly.model;

import java.io.Serializable;
import java.util.Locale;

/**
 * A User is a person that is using this program. Contains the basic information about the user.
 */
public class User implements Serializable {

    /**
     * User name.
     */
    private String name;

    /**
     * Unique id of the {@link de.hhn.labsw.laspoly.model.User}.
     */
    private Integer id;

    /**
     * The locale of this user.
     */
    private Locale locale;

    /**
     * The symbolic imageID that this user chose.
     */
    private int imageID;

    /**
     * Constructor with username as parameter.
     *
     * @param userName Username for the user.
     * @param imageID ID of the user image.
     */
    public User (String userName, Locale locale, int imageID) {
        this.locale = locale;
        this.imageID = imageID;
        name = userName;
        id = -1;
    }

    /**
     * @return the String value of the username.
     */
    public String getName () {
        return name;
    }

    /**
     * Sets the Value of the username.
     *
     * @param name New value for username.
     */
    public void setName (String name) {
        this.name = name;
    }

    @Override
    public String toString () {
        return "User{" +
                "name='" + name + '\'' +
                ", id=" + id +
                ", locale=" + locale +
                ", imageID=" + imageID +
                '}';
    }

    /**
     * @return {@link #id}.
     */
    public Integer getId () {
        return id;
    }

    /**
     * Sets {@link #id}.
     *
     * @param id New value for {@link #id}.
     */
    public void setId (Integer id) {
        this.id = id;
    }

    /**
     * @return {@link #locale}.
     */
    public Locale getLocale () {
        return locale;
    }

    /**
     * Sets {@link #locale}.
     *
     * @param locale The new locale of this user.
     */
    public void setLocale (Locale locale) {
        this.locale = locale;
    }

    /**
     * @return {@link #imageID}.
     */
    public int getImageID () {
        return imageID;
    }

    /**
     * Sets the id for the image.
     *
     * @param id Id of the image.
     */
    public void setImageID (int id) {
        imageID = id;
    }

    @Override
    public boolean equals (Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;

        User user = (User) o;
        return !(id != null ? !id.equals(user.id) : user.id != null);
    }

    @Override
    public int hashCode () {
        return id != null ? id.hashCode() : 0;
    }
}
